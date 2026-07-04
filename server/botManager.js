const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys")
const pino = require("pino")
const fs = require("fs")
const path = require("path")
const db = require("./db")

let io = null
const instances = {}

function setIo(socketIo) {
    io = socketIo
}

function getSessionDir(userId, botId) {
    const dir = path.join(__dirname, "..", "sessions", String(userId), String(botId))
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    return dir
}

async function addLog(botId, level, message) {
    try {
        await db.query("INSERT INTO logs (bot_id, level, message) VALUES ($1, $2, $3)", [botId, level, message])
        const maxLogs = 500
        await db.query(
            "DELETE FROM logs WHERE bot_id = $1 AND id NOT IN (SELECT id FROM logs WHERE bot_id = $2 ORDER BY id DESC LIMIT $3)",
            [botId, botId, maxLogs]
        )
    } catch {}
    if (io) io.to(`bot:${botId}`).emit("log", { botId, level, message, timestamp: new Date().toISOString() })
}

async function incrementStat(botId, field) {
    const today = new Date().toISOString().slice(0, 10)
    const allowedFields = ["messages_received", "commands_used"]
    if (!allowedFields.includes(field)) return
    await db.query(
        `INSERT INTO stats (bot_id, date, ${field}) VALUES ($1, $2, 1)
        ON CONFLICT (bot_id, date) DO UPDATE SET ${field} = stats.${field} + 1`,
        [botId, today]
    )
}

async function updateBotStatus(botId, userId, status) {
    await db.query("UPDATE bots SET status = $1 WHERE id = $2", [status, botId])
    if (io) {
        io.to(`user:${userId}`).emit("bot-status", { botId, status })
        io.to(`bot:${botId}`).emit("bot-status", { botId, status })
    }
}

async function startBot(botId, userId, phone) {
    const key = `${userId}_${botId}`
    if (instances[key]) {
        await stopBot(botId, userId)
    }

    await updateBotStatus(botId, userId, "connecting")
    addLog(botId, "info", "🔄 Démarrage de la connexion WhatsApp...")

    const sessionDir = getSessionDir(userId, botId)
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir)
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 15000,
        retryRequestDelayMs: 2000,
        defaultQueryTimeoutMs: 60000,
        generateHighQualityLinkPreview: false
    })

    instances[key] = { sock, userId, botId }

    if (!sock.authState.creds.registered) {
        await new Promise(resolve => setTimeout(resolve, 3000))
        if (phone) {
            try {
                const cleanPhone = phone.replace(/\D/g, "")
                const code = await sock.requestPairingCode(cleanPhone)
                addLog(botId, "info", `🔑 Code de couplage : ${code}`)
                if (io) io.to(`bot:${botId}`).emit("pair-code", { botId, code })
            } catch (e) {
                addLog(botId, "error", `❌ Erreur code de couplage: ${e.message}`)
            }
        }
    }

    sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
        if (qr) {
            addLog(botId, "info", "📱 QR Code généré — scannez avec WhatsApp")
            if (io) io.to(`bot:${botId}`).emit("qr", { botId, qr })
        }

        if (connection === "open") {
            await updateBotStatus(botId, userId, "connected")
            const phoneNum = sock.user?.id?.split(":")[0] || phone
            if (phoneNum) await db.query("UPDATE bots SET phone = $1 WHERE id = $2", [phoneNum, botId])
            addLog(botId, "success", `✅ Bot connecté ! Numéro: ${phoneNum}`)
        }

        if (connection === "close") {
            const code = lastDisconnect?.error?.output?.statusCode
            if (code === DisconnectReason.loggedOut) {
                addLog(botId, "warn", "⚠️ Session expirée — reconnexion manuelle requise")
                await updateBotStatus(botId, userId, "disconnected")
                delete instances[key]
            } else {
                addLog(botId, "warn", `🔄 Reconnexion... (code: ${code})`)
                await updateBotStatus(botId, userId, "reconnecting")
                setTimeout(() => startBot(botId, userId, phone), 5000)
            }
        }
    })

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("messages.upsert", async ({ messages }) => {
        for (const msg of messages) {
            if (!msg.message || msg.key.fromMe) continue
            incrementStat(botId, "messages_received")

            const botConfigResult = await db.query("SELECT * FROM bots WHERE id = $1", [botId])
            const botConfig = botConfigResult.rows[0]
            if (!botConfig) continue
            const prefix = botConfig.prefix || "!"
            const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ""
            if (!body.startsWith(prefix)) continue

            const cmdName = body.slice(prefix.length).split(" ")[0].toLowerCase()
            const cmdRowResult = await db.query(
                "SELECT * FROM commands WHERE bot_id = $1 AND name = $2 AND enabled = 1",
                [botId, cmdName]
            )
            const cmdRow = cmdRowResult.rows[0]

            if (cmdRow && cmdRow.type === "custom" && cmdRow.response) {
                incrementStat(botId, "commands_used")
                addLog(botId, "info", `📩 Commande personnalisée: ${prefix}${cmdName}`)
                await sock.sendMessage(msg.key.remoteJid, { text: cmdRow.response })
            }
        }
    })
}

async function stopBot(botId, userId) {
    const key = `${userId}_${botId}`
    if (instances[key]) {
        try {
            instances[key].sock.end()
        } catch {}
        delete instances[key]
    }
    await updateBotStatus(botId, userId, "disconnected")
    addLog(botId, "info", "🛑 Bot déconnecté")
}

function getBotInstance(botId, userId) {
    return instances[`${userId}_${botId}`] || null
}

function isRunning(botId, userId) {
    return !!instances[`${userId}_${botId}`]
}

module.exports = { setIo, startBot, stopBot, getBotInstance, isRunning, addLog }
