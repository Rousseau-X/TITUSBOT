const fs = require("fs")
const path = require("path")

const dataDir = path.join(__dirname, "..", "data")
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

function loadTable(name) {
    const file = path.join(dataDir, `${name}.json`)
    if (!fs.existsSync(file)) return []
    try { return JSON.parse(fs.readFileSync(file, "utf8")) } catch { return [] }
}

function saveTable(name, rows) {
    const file = path.join(dataDir, `${name}.json`)
    fs.writeFileSync(file, JSON.stringify(rows, null, 2))
}

const tables = ["users", "bots", "commands", "blacklist", "stats", "logs"]
const data = {}
for (const t of tables) data[t] = loadTable(t)

const counters = {}
for (const t of tables) {
    const rows = data[t]
    counters[t] = rows.length > 0 ? Math.max(...rows.map(r => r.id || 0)) : 0
}

function nextId(table) {
    counters[table] = (counters[table] || 0) + 1
    return counters[table]
}

function save(table) {
    try { saveTable(table, data[table]) } catch {}
}

function matchRow(row, where) {
    for (const [k, v] of Object.entries(where)) {
        if (row[k] != v) return false
    }
    return true
}

function parseSQL(sql) {
    const s = sql.trim()
    const upper = s.toUpperCase()

    if (upper.startsWith("SELECT")) {
        const fromMatch = s.match(/FROM\s+(\w+)/i)
        const whereMatch = s.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/i)
        const orderMatch = s.match(/ORDER BY\s+(\w+)\s*(ASC|DESC)?/i)
        const limitMatch = s.match(/LIMIT\s+(\d+)/i)
        const groupMatch = s.match(/GROUP BY\s+(\w+)/i)
        const table = fromMatch ? fromMatch[1].toLowerCase() : null
        return { type: "SELECT", table, whereClause: whereMatch?.[1] || null, orderBy: orderMatch?.[1] || null, orderDesc: orderMatch?.[2] === "DESC", limit: limitMatch ? parseInt(limitMatch[1]) : null }
    }

    if (upper.startsWith("INSERT")) {
        const tableMatch = s.match(/INTO\s+(\w+)/i)
        return { type: "INSERT", table: tableMatch?.[1].toLowerCase() }
    }

    if (upper.startsWith("UPDATE")) {
        const tableMatch = s.match(/UPDATE\s+(\w+)/i)
        return { type: "UPDATE", table: tableMatch?.[1].toLowerCase() }
    }

    if (upper.startsWith("DELETE")) {
        const tableMatch = s.match(/FROM\s+(\w+)/i)
        return { type: "DELETE", table: tableMatch?.[1].toLowerCase() }
    }

    return { type: "OTHER" }
}

function applyWhere(rows, whereClause, params) {
    if (!whereClause) return rows
    let p = 0
    const conditions = whereClause.split(/\s+AND\s+/i)
    return rows.filter(row => {
        return conditions.every(cond => {
            const eqMatch = cond.match(/(\w+)\s*=\s*\?/)
            const inMatch = cond.match(/(\w+)\s+IN\s+\(([^)]+)\)/i)
            const notInMatch = cond.match(/(\w+)\s+NOT\s+IN\s+\(([^)]+)\)/i)
            if (eqMatch) {
                const val = params[p++]
                return String(row[eqMatch[1]]) === String(val)
            }
            if (inMatch) {
                const count = (inMatch[2].match(/\?/g) || []).length
                const vals = params.slice(p, p + count).map(String)
                p += count
                return vals.includes(String(row[inMatch[1]]))
            }
            if (notInMatch) {
                const count = (notInMatch[2].match(/\?/g) || []).length
                const vals = params.slice(p, p + count).map(String)
                p += count
                return !vals.includes(String(row[notInMatch[1]]))
            }
            return true
        })
    })
}

const db = {
    prepare(sql) {
        const parsed = parseSQL(sql)
        const sqlLower = sql.toLowerCase().trim()

        return {
            run(...args) {
                const params = args.flat()
                const { table } = parsed
                if (!table || !data[table]) return { lastInsertRowid: null, changes: 0 }

                if (parsed.type === "INSERT") {
                    if (sqlLower.includes("on conflict") && sqlLower.includes("do update")) {
                        return this._upsert(sql, params, table)
                    }
                    if (sqlLower.includes("or ignore") || sqlLower.includes("insert or ignore")) {
                        const cols = this._extractInsertCols(sql)
                        const uniqueFields = this._getUniqueFields(table)
                        const values = this._buildValues(cols, params)
                        for (const uf of uniqueFields) {
                            if (values[uf] !== undefined && data[table].some(r => String(r[uf]) === String(values[uf]))) {
                                return { lastInsertRowid: null, changes: 0 }
                            }
                        }
                        const newRow = { id: nextId(table), ...values }
                        data[table].push(newRow)
                        save(table)
                        return { lastInsertRowid: newRow.id, changes: 1 }
                    }
                    const cols = this._extractInsertCols(sql)
                    const values = this._buildValues(cols, params)
                    const newRow = { id: nextId(table), ...values }
                    data[table].push(newRow)
                    save(table)
                    return { lastInsertRowid: newRow.id, changes: 1 }
                }

                if (parsed.type === "UPDATE") {
                    const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/i)
                    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s*$)/i)
                    const setCols = setMatch ? setMatch[1].split(",").map(s => s.trim().split("=")[0].trim()) : []
                    const setCount = setCols.length
                    const setVals = params.slice(0, setCount)
                    const whereParams = params.slice(setCount)
                    const whereClause = whereMatch?.[1] || null
                    let changes = 0
                    data[table] = data[table].map(row => {
                        const matches = whereClause ? applyWhere([row], whereClause, [...whereParams]).length > 0 : true
                        if (!matches) return row
                        changes++
                        const updated = { ...row }
                        setCols.forEach((col, i) => { updated[col] = setVals[i] })
                        return updated
                    })
                    save(table)
                    return { changes }
                }

                if (parsed.type === "DELETE") {
                    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s*$)/i)
                    const whereClause = whereMatch?.[1] || null
                    const before = data[table].length
                    if (whereClause) {
                        data[table] = data[table].filter(row => applyWhere([row], whereClause, params).length === 0)
                    } else {
                        data[table] = []
                    }
                    const changes = before - data[table].length
                    if (changes > 0) save(table)
                    return { changes }
                }

                return { lastInsertRowid: null, changes: 0 }
            },

            _upsert(sql, params, table) {
                const cols = this._extractInsertCols(sql)
                const values = this._buildValues(cols, params.slice(0, cols.length))
                const uniqueFields = this._getUniqueFields(table)
                const idx = data[table].findIndex(r => uniqueFields.some(uf => values[uf] !== undefined && String(r[uf]) === String(values[uf])))
                if (idx >= 0) {
                    const updatePart = sql.match(/DO UPDATE SET\s+(.+?)(?:\s*$)/i)?.[1] || ""
                    const updateCols = updatePart.split(",").map(s => s.trim().split("=")[0].trim())
                    const existing = { ...data[table][idx] }
                    updateCols.forEach(col => { existing[col] = (existing[col] || 0) + 1 })
                    data[table][idx] = existing
                    save(table)
                    return { lastInsertRowid: existing.id, changes: 1 }
                }
                const newRow = { id: nextId(table), ...values }
                data[table].push(newRow)
                save(table)
                return { lastInsertRowid: newRow.id, changes: 1 }
            },

            _extractInsertCols(sql) {
                const colMatch = sql.match(/\(([^)]+)\)\s+VALUES/i)
                return colMatch ? colMatch[1].split(",").map(s => s.trim()) : []
            },

            _buildValues(cols, params) {
                const values = {}
                cols.forEach((col, i) => { values[col] = params[i] })
                return values
            },

            _getUniqueFields(table) {
                const uniqMap = {
                    users: ["email"],
                    commands: ["bot_id_name"],
                    blacklist: ["bot_id_number"],
                    stats: ["bot_id_date"]
                }
                return uniqMap[table]?.filter(f => !f.includes("_")) || []
            },

            get(...args) {
                const params = args.flat()
                const { table } = parsed
                if (!table || !data[table]) return undefined

                if (sqlLower.includes("sum(") || sqlLower.includes("count(")) {
                    return this._aggregate(sql, params, table)
                }

                const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/i)
                const rows = applyWhere(data[table], whereMatch?.[1] || null, params)
                if (parsed.orderBy) rows.sort((a, b) => parsed.orderDesc ? (b[parsed.orderBy] > a[parsed.orderBy] ? 1 : -1) : (a[parsed.orderBy] > b[parsed.orderBy] ? 1 : -1))
                return rows[0]
            },

            all(...args) {
                const params = args.flat()
                const { table } = parsed
                if (!table || !data[table]) return []

                if (sqlLower.includes("sum(") || sqlLower.includes("count(")) {
                    const result = this._aggregate(sql, params, table)
                    return result ? [result] : []
                }

                const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/i)
                let rows = applyWhere([...data[table]], whereMatch?.[1] || null, params)

                if (parsed.orderBy) rows.sort((a, b) => parsed.orderDesc ? (b[parsed.orderBy] > a[parsed.orderBy] ? 1 : -1) : (a[parsed.orderBy] > b[parsed.orderBy] ? 1 : -1))
                if (parsed.limit) rows = rows.slice(0, parsed.limit)
                return rows
            },

            _aggregate(sql, params, table) {
                const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+GROUP|\s+ORDER|\s+LIMIT|$)/i)
                const rows = applyWhere(data[table], whereMatch?.[1] || null, params)

                const result = {}
                const sumMatches = [...sql.matchAll(/SUM\((\w+)\)\s+as\s+(\w+)/gi)]
                const countMatches = [...sql.matchAll(/COUNT\(\*\)\s+as\s+(\w+)/gi)]

                for (const [, col, alias] of sumMatches) {
                    result[alias] = rows.reduce((acc, r) => acc + (Number(r[col]) || 0), 0)
                }
                for (const [, alias] of countMatches) {
                    result[alias] = rows.length
                }
                return Object.keys(result).length ? result : undefined
            }
        }
    },

    exec() {},
    pragma() {}
}

module.exports = db
