const express = require("express")
const db = require("../db")
const { startBot, stopBot, isRunning, addLog } = require("../botManager")
const fs = require("fs")
const path = require("path")

const router = express.Router()

const BUILTIN_COMMANDS = [
    { name: "ping", description: "Teste la réactivité du bot" },
    { name: "menu", description: "Affiche le menu des commandes" },
    { name: "info", description: "Infos sur le bot" },
    { name: "ban", description: "Bannit un membre du groupe" },
    { name: "kick", description: "Expulse un membre" },
    { name: "mute", description: "Rend muet un membre" },
    { name: "unmute", description: "Retire le mode muet" },
    { name: "promote", description: "Promeut en admin" },
    { name: "demote", description: "Rétrograde un admin" },
    { name: "tagall", description: "Mentionne tous les membres" },
    { name: "sticker", description: "Crée un sticker depuis une image" },
    { name: "ytb", description: "Télécharge une vidéo YouTube" },
    { name: "ytmp3", description: "Télécharge l'audio YouTube" },
    { name: "quiz", description: "Lance un quiz" },
    { name: "stats", description: "Statistiques du bot" },
    { name: "uptime", description: "Temps de fonctionnement" },
    { name: "traduire", description: "Traduit un texte" },
    { name: "meteo", description: "Météo d'une ville" },
    { name: "crypto", description: "Prix des cryptomonnaies" },
    { name: "love", description: "Compatibilité amoureuse" },
    { name: "blague", description: "Raconte une blague" },
    { name: "coinflip", description: "Pile ou face" },
    { name: "dice", description: "Lancer de dé" },
    { name: "antidelete", description: "Anti-suppression de messages" },
    { name: "autoviewstatus", description: "Vue automatique des statuts" },
    { name: "setwelcome", description: "Message de bienvenue" },
    { name: "setgoodbye", description: "Message d'au revoir" },
    { name: "warn", description: "Avertir un membre" },
    { name: "groupinfo", description: "Infos du groupe" },
    { name: "hidetag", description: "Tag invisible" },
    { name: "qrcode", description: "Génère un QR code" },
    { name: "base64", description: "Encode/décode en base64" },
    { name: "shorturl", description: "Raccourcit une URL" },
    { name: "ip", description: "Infos sur une IP" },
    { name: "password", description: "Génère un mot de passe" },
    { name: "tts", description: "Texte en parole" },
    { name: "ask", description: "Pose une question à l'IA" },
]

router.get("/", (req, res) => {
    const bots = db.prepare("SELECT * FROM bots WHERE user_id = ? ORDER BY created_at DESC").all(req.userId)
    res.json(bots.map(b => ({ ...b, running: isRunning(b.id, req.userId) })))
})

router.post("/", (req, res) => {
    const { name, phone } = req.body
    if (!name) return res.status(400).json({ error: "Nom requis" })
    const result = db.prepare("INSERT INTO bots (user_id, name, phone) VALUES (?, ?, ?)").run(req.userId, name, phone || null)
    const botId = result.lastInsertRowid

    const insertCmd = db.prepare("INSERT OR IGNORE INTO commands (bot_id, name, enabled, type, description) VALUES (?, ?, 1, 'builtin', ?)")
    for (const cmd of BUILTIN_COMMANDS) {
        insertCmd.run(botId, cmd.name, cmd.description)
    }
    addLog(botId, "info", `🤖 Bot "${name}" créé`)
    const bot = db.prepare("SELECT * FROM bots WHERE id = ?").get(botId)
    res.json(bot)
})

router.get("/overview", (req, res) => {
    const bots = db.prepare("SELECT * FROM bots WHERE user_id = ?").all(req.userId)
    const today = new Date().toISOString().slice(0, 10)
    let totalMessages = 0, totalCommands = 0, connectedBots = 0
    for (const bot of bots) {
        const s = db.prepare("SELECT * FROM stats WHERE bot_id = ? AND date = ?").get(bot.id, today)
        if (s) { totalMessages += s.messages_received || 0; totalCommands += s.commands_used || 0 }
        if (bot.status === "connected") connectedBots++
    }
    res.json({ totalBots: bots.length, connectedBots, todayMessages: totalMessages, todayCommands: totalCommands })
})

router.get("/:id", (req, res) => {
    const bot = db.prepare("SELECT * FROM bots WHERE id = ? AND user_id = ?").get(req.params.id, req.userId)
    if (!bot) return res.status(404).json({ error: "Bot non trouvé" })
    res.json({ ...bot, running: isRunning(bot.id, req.userId) })
})

router.delete("/:id", async (req, res) => {
    const bot = db.prepare("SELECT * FROM bots WHERE id = ? AND user_id = ?").get(req.params.id, req.userId)
    if (!bot) return res.status(404).json({ error: "Bot non trouvé" })
    await stopBot(bot.id, req.userId)
    const sessionDir = path.join(__dirname, "..", "..", "sessions", String(req.userId), String(bot.id))
    if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true })
    db.prepare("DELETE FROM bots WHERE id = ?").run(bot.id)
    res.json({ ok: true })
})

router.post("/:id/connect", async (req, res) => {
    const bot = db.prepare("SELECT * FROM bots WHERE id = ? AND user_id = ?").get(req.params.id, req.userId)
    if (!bot) return res.status(404).json({ error: "Bot non trouvé" })
    if (isRunning(bot.id, req.userId)) return res.status(400).json({ error: "Bot déjà en cours" })
    startBot(bot.id, req.userId, req.body.phone || bot.phone).catch(e => {
        addLog(bot.id, "error", `Erreur démarrage: ${e.message}`)
    })
    res.json({ ok: true, message: "Connexion en cours..." })
})

router.post("/:id/disconnect", async (req, res) => {
    const bot = db.prepare("SELECT * FROM bots WHERE id = ? AND user_id = ?").get(req.params.id, req.userId)
    if (!bot) return res.status(404).json({ error: "Bot non trouvé" })
    await stopBot(bot.id, req.userId)
    res.json({ ok: true })
})

router.get("/:id/logs", (req, res) => {
    const bot = db.prepare("SELECT id FROM bots WHERE id = ? AND user_id = ?").get(req.params.id, req.userId)
    if (!bot) return res.status(404).json({ error: "Bot non trouvé" })
    const logs = db.prepare("SELECT * FROM logs WHERE bot_id = ? ORDER BY created_at DESC LIMIT 100").all(bot.id)
    res.json(logs.reverse())
})

router.get("/:id/blacklist", (req, res) => {
    const bot = db.prepare("SELECT id FROM bots WHERE id = ? AND user_id = ?").get(req.params.id, req.userId)
    if (!bot) return res.status(404).json({ error: "Bot non trouvé" })
    const items = db.prepare("SELECT * FROM blacklist WHERE bot_id = ? ORDER BY created_at DESC").all(bot.id)
    res.json(items)
})

router.post("/:id/blacklist", (req, res) => {
    const bot = db.prepare("SELECT id FROM bots WHERE id = ? AND user_id = ?").get(req.params.id, req.userId)
    if (!bot) return res.status(404).json({ error: "Bot non trouvé" })
    const { number } = req.body
    if (!number) return res.status(400).json({ error: "Numéro requis" })
    db.prepare("INSERT OR IGNORE INTO blacklist (bot_id, number) VALUES (?, ?)").run(bot.id, number)
    res.json({ ok: true })
})

router.delete("/:id/blacklist/:number", (req, res) => {
    const bot = db.prepare("SELECT id FROM bots WHERE id = ? AND user_id = ?").get(req.params.id, req.userId)
    if (!bot) return res.status(404).json({ error: "Bot non trouvé" })
    db.prepare("DELETE FROM blacklist WHERE bot_id = ? AND number = ?").run(bot.id, req.params.number)
    res.json({ ok: true })
})

module.exports = router
