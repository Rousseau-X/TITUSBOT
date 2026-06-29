const fs = require("fs")
const path = require("path")

const dataDir = path.join(__dirname, "..", "data")
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

// ── persistence ──────────────────────────────────────────────────────────────
function loadTable(name) {
    const file = path.join(dataDir, `${name}.json`)
    if (!fs.existsSync(file)) return []
    try { return JSON.parse(fs.readFileSync(file, "utf8")) } catch { return [] }
}
function saveTable(name, rows) {
    fs.writeFileSync(path.join(dataDir, `${name}.json`), JSON.stringify(rows, null, 2))
}

const TABLES = ["users", "bots", "commands", "blacklist", "stats", "logs"]
const store = {}
const counters = {}
for (const t of TABLES) {
    store[t] = loadTable(t)
    counters[t] = store[t].length ? Math.max(...store[t].map(r => Number(r.id) || 0)) : 0
}

function nextId(table) {
    counters[table] = (counters[table] || 0) + 1
    return counters[table]
}
function persist(table) {
    try { saveTable(table, store[table]) } catch {}
}

// ── WHERE clause evaluator ────────────────────────────────────────────────────
// Returns true if row matches all conditions given positional params array
function rowMatchesWhere(row, whereClause, params, paramStart) {
    if (!whereClause) return true
    let p = paramStart
    const conditions = whereClause.trim().split(/\s+AND\s+/i)
    for (const cond of conditions) {
        const c = cond.trim()
        const eqMatch = c.match(/^(\w+)\s*=\s*\?$/)
        if (eqMatch) {
            if (String(row[eqMatch[1]]) !== String(params[p++])) return false
            continue
        }
        // NOT IN (?, ?, ...)
        const notInMatch = c.match(/^(\w+)\s+NOT\s+IN\s*\(([^)]+)\)$/i)
        if (notInMatch) {
            const slots = (notInMatch[2].match(/\?/g) || []).length
            const vals = params.slice(p, p + slots).map(String)
            p += slots
            if (vals.includes(String(row[notInMatch[1]]))) return false
            continue
        }
        // IN (?, ?, ...)
        const inMatch = c.match(/^(\w+)\s+IN\s*\(([^)]+)\)$/i)
        if (inMatch) {
            const slots = (inMatch[2].match(/\?/g) || []).length
            const vals = params.slice(p, p + slots).map(String)
            p += slots
            if (!vals.includes(String(row[inMatch[1]]))) return false
            continue
        }
    }
    return true
}

function filterRows(rows, whereClause, params) {
    if (!whereClause) return rows
    // Each row gets its own fresh param cursor
    return rows.filter(row => rowMatchesWhere(row, whereClause, params, 0))
}

// ── SQL helpers ───────────────────────────────────────────────────────────────
function extractTable(sql) {
    const upper = sql.trim().toUpperCase()
    if (upper.startsWith("INSERT")) return (sql.match(/INTO\s+(\w+)/i) || [])[1]?.toLowerCase()
    if (upper.startsWith("UPDATE")) return (sql.match(/UPDATE\s+(\w+)/i) || [])[1]?.toLowerCase()
    if (upper.startsWith("DELETE")) return (sql.match(/FROM\s+(\w+)/i) || [])[1]?.toLowerCase()
    if (upper.startsWith("SELECT")) return (sql.match(/FROM\s+(\w+)/i) || [])[1]?.toLowerCase()
    return null
}

function extractWhere(sql) {
    const m = sql.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+LIMIT|\s*$)/i)
    return m ? m[1].trim() : null
}

function extractOrderLimit(sql) {
    const order = sql.match(/ORDER\s+BY\s+(\w+)\s*(ASC|DESC)?/i)
    const limit = sql.match(/LIMIT\s+(\d+)/i)
    return {
        orderBy: order ? order[1] : null,
        orderDesc: order?.[2]?.toUpperCase() === "DESC",
        limit: limit ? parseInt(limit[1]) : null
    }
}

// ── aggregate helper ──────────────────────────────────────────────────────────
function aggregate(sql, rows) {
    const result = {}
    for (const [, col, alias] of sql.matchAll(/SUM\s*\(\s*(\w+)\s*\)\s+(?:as\s+)?(\w+)/gi))
        result[alias] = rows.reduce((s, r) => s + (Number(r[col]) || 0), 0)
    for (const [, alias] of sql.matchAll(/COUNT\s*\(\s*\*\s*\)\s+(?:as\s+)?(\w+)/gi))
        result[alias] = rows.length
    return Object.keys(result).length ? result : undefined
}

// ── unique-constraint check ───────────────────────────────────────────────────
const UNIQUE_FIELDS = {
    users: [["email"]],
    commands: [["bot_id", "name"]],
    blacklist: [["bot_id", "number"]],
    stats: [["bot_id", "date"]],
}

function violatesUnique(table, values) {
    const constraints = UNIQUE_FIELDS[table] || []
    for (const fields of constraints) {
        if (fields.every(f => values[f] !== undefined)) {
            const exists = store[table].some(r =>
                fields.every(f => String(r[f]) === String(values[f]))
            )
            if (exists) return true
        }
    }
    return false
}

function findByUnique(table, values) {
    const constraints = UNIQUE_FIELDS[table] || []
    for (const fields of constraints) {
        if (fields.every(f => values[f] !== undefined)) {
            const idx = store[table].findIndex(r =>
                fields.every(f => String(r[f]) === String(values[f]))
            )
            if (idx >= 0) return idx
        }
    }
    return -1
}

// ── INSERT column/value extractor ─────────────────────────────────────────────
// Handles both `?` placeholders AND inline literals like `1` or `'builtin'`
function extractInsertColsAndValues(sql, params) {
    const colMatch = sql.match(/\(([^)]+)\)\s+VALUES\s*\(([^)]+)\)/i)
    if (!colMatch) return {}
    const cols = colMatch[1].split(",").map(s => s.trim())
    const valTokens = colMatch[2].split(",").map(s => s.trim())
    const values = {}
    let p = 0
    for (let i = 0; i < cols.length; i++) {
        const tok = valTokens[i]
        if (tok === "?") {
            values[cols[i]] = params[p++]
        } else if (/^'(.*)'$/.test(tok)) {
            values[cols[i]] = tok.slice(1, -1)
        } else if (/^\d+$/.test(tok)) {
            values[cols[i]] = Number(tok)
        } else {
            values[cols[i]] = tok
        }
    }
    return values
}

// ── main db object ─────────────────────────────────────────────────────────────
const db = {
    prepare(sql) {
        const sqlLower = sql.toLowerCase().trim()
        const table = extractTable(sql)

        return {
            run(...args) {
                const params = args.flat()
                if (!table || !store[table]) return { lastInsertRowid: null, changes: 0 }

                // ── INSERT ──
                if (sqlLower.startsWith("insert")) {
                    const values = extractInsertColsAndValues(sql, params)

                    // ON CONFLICT … DO UPDATE (upsert / increment)
                    if (sqlLower.includes("on conflict") && sqlLower.includes("do update")) {
                        const idx = findByUnique(table, values)
                        if (idx >= 0) {
                            const setMatch = sql.match(/DO UPDATE SET\s+(.+?)(?:\s*$)/i)
                            if (setMatch) {
                                const setParts = setMatch[1].split(",").map(s => s.trim())
                                for (const part of setParts) {
                                    const col = part.split("=")[0].trim()
                                    store[table][idx][col] = (Number(store[table][idx][col]) || 0) + 1
                                }
                            }
                            persist(table)
                            return { lastInsertRowid: store[table][idx].id, changes: 1 }
                        }
                    }

                    // INSERT OR IGNORE
                    if (sqlLower.includes("or ignore")) {
                        if (violatesUnique(table, values)) return { lastInsertRowid: null, changes: 0 }
                    }

                    const newRow = { id: nextId(table), ...values }
                    store[table].push(newRow)
                    persist(table)
                    return { lastInsertRowid: newRow.id, changes: 1 }
                }

                // ── UPDATE ──
                if (sqlLower.startsWith("update")) {
                    const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/i)
                    const whereClause = extractWhere(sql)
                    if (!setMatch) return { changes: 0 }
                    const setParts = setMatch[1].split(",").map(s => s.trim())
                    const setCols = setParts.map(p => p.split("=")[0].trim())
                    const setCount = setCols.length
                    const setVals = params.slice(0, setCount)
                    const whereParams = params.slice(setCount)
                    let changes = 0
                    store[table] = store[table].map(row => {
                        if (!rowMatchesWhere(row, whereClause, whereParams, 0)) return row
                        changes++
                        const updated = { ...row }
                        setCols.forEach((col, i) => { updated[col] = setVals[i] })
                        return updated
                    })
                    if (changes) persist(table)
                    return { changes }
                }

                // ── DELETE ──
                if (sqlLower.startsWith("delete")) {
                    const whereClause = extractWhere(sql)
                    const before = store[table].length
                    if (whereClause) {
                        store[table] = store[table].filter(row => !rowMatchesWhere(row, whereClause, params, 0))
                    } else {
                        store[table] = []
                    }
                    const changes = before - store[table].length
                    if (changes > 0) persist(table)
                    return { changes }
                }

                return { lastInsertRowid: null, changes: 0 }
            },

            get(...args) {
                const params = args.flat()
                if (!table || !store[table]) return undefined
                if (/sum\s*\(|count\s*\(/.test(sqlLower)) {
                    const whereClause = extractWhere(sql)
                    const rows = filterRows(store[table], whereClause, params)
                    return aggregate(sql, rows)
                }
                const whereClause = extractWhere(sql)
                const { orderBy, orderDesc, limit } = extractOrderLimit(sql)
                let rows = filterRows([...store[table]], whereClause, params)
                if (orderBy) rows.sort((a, b) => orderDesc ? (b[orderBy] > a[orderBy] ? 1 : -1) : (a[orderBy] > b[orderBy] ? 1 : -1))
                if (limit) rows = rows.slice(0, limit)
                return rows[0]
            },

            all(...args) {
                const params = args.flat()
                if (!table || !store[table]) return []
                if (/sum\s*\(|count\s*\(/.test(sqlLower)) {
                    const whereClause = extractWhere(sql)
                    const rows = filterRows(store[table], whereClause, params)
                    const result = aggregate(sql, rows)
                    return result ? [result] : []
                }
                const whereClause = extractWhere(sql)
                const { orderBy, orderDesc, limit } = extractOrderLimit(sql)
                let rows = filterRows([...store[table]], whereClause, params)
                if (orderBy) rows.sort((a, b) => orderDesc ? (b[orderBy] > a[orderBy] ? 1 : -1) : (a[orderBy] > b[orderBy] ? 1 : -1))
                if (limit) rows = rows.slice(0, limit)
                return rows
            }
        }
    },

    exec() {},
    pragma() {}
}

module.exports = db
