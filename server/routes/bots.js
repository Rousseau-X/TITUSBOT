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

router.get("/", async (req, res) => {
    const result = await db.query("SELECT * FROM bots WHERE user_id = $1 ORDER BY created_at DESC", [req.userId])
    res.json(result.rows.map(b => ({ ...b, running: isRunning(b.id, req.userId) })))
})

router.post("/", async (req, res) => {
    const { name, phone } = req.body
    if (!name) return res.status(400).json({ error: "Nom requis" })
    const result = await db.query("INSERT INTO bots (user_id, name, phone) VALUES ($1, $2, $3) RETURNING id", [req.userId, name, phone || null])
    const botId = result.rows[0].id

    for (const cmd of BUILTIN_COMMANDS) {
        await db.query(
            "INSERT INTO commands (bot_id, name, enabled, type, description) VALUES ($1, $2, 1, 'builtin', $3) ON CONFLICT (bot_id, name) DO NOTHING",
            [botId, cmd.name, cmd.description]
        )
    }
    addLog(botId, "info", `🤖 Bot "${name}" créé`)
    const botResult = await db.query("SELECT * FROM bots WHERE id = $1", [botId])
    res.json(botResult.rows[0])
})

router.get("/overview", async (req, res) => {
    const botsResult = await db.query("SELECT * FROM bots WHERE user_id = $1", [req.userId])
    const bots = botsResult.rows
    const today = new Date().toISOString().slice(0, 10)
    let totalMessages = 0, totalCommands = 0, connectedBots = 0
    for (const bot of bots) {
        const s = (await db.query("SELECT * FROM stats WHERE bot_id = $1 AND date = $2", [bot.id, today])).rows[0]
        if (s) { totalMessages += s.messages_received || 0; totalCommands += s.commands_used || 0 }
        if (bot.status === "connected") connectedBots++
    }
    res.json({ totalBots: bots.length, connectedBots, todayMessages: totalMessages, todayCommands: totalCommands })
})

router.get("/:id", async (req, res) => {
    const result = await db.query("SELECT * FROM bots WHERE id = $1 AND user_id = $2", [req.params.id, req.userId])
    const bot = result.rows[0]
    if (!bot) return res.status(404).json({ error: "Bot non trouvé" })
    res.json({ ...bot, running: isRunning(bot.id, req.userId) })
})

router.delete("/:id", async (req, res) => {
    const result = await db.query("SELECT * FROM bots WHERE id = $1 AND user_id = $2", [req.params.id, req.userId])
    const bot = result.rows[0]
    if (!bot) return res.status(404).json({ error: "Bot non trouvé" })
    await stopBot(bot.id, req.userId)
    const sessionDir = path.join(__dirname, "..", "..", "sessions", String(req.userId), String(bot.id))
    if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true })
    await db.query("DELETE FROM bots WHERE id = $1", [bot.id])
    res.json({ ok: true })
})

router.post("/:id/connect", async (req, res) => {
    const result = await db.query("SELECT * FROM bots WHERE id = $1 AND user_id = $2", [req.params.id, req.userId])
    const bot = result.rows[0]
    if (!bot) return res.status(404).json({ error: "Bot non trouvé" })
    if (isRunning(bot.id, req.userId)) return res.status(400).json({ error: "Bot déjà en cours" })
    startBot(bot.id, req.userId, req.body.phone || bot.phone).catch(e => {
        addLog(bot.id, "error", `Erreur démarrage: ${e.message}`)
    })
    res.json({ ok: true, message: "Connexion en cours..." })
})

router.post("/:id/disconnect", async (req, res) => {
    const result = await db.query("SELECT * FROM bots WHERE id = $1 AND user_id = $2", [req.params.id, req.userId])
    const bot = result.rows[0]
    if (!bot) return res.status(404).json({ error: "Bot non trouvé" })
    await stopBot(bot.id, req.userId)
    res.json({ ok: true })
})

router.get("/:id/logs", async (req, res) => {
    const result = await db.query("SELECT id FROM bots WHERE id = $1 AND user_id = $2", [req.params.id, req.userId])
    const bot = result.rows[0]
    if (!bot) return res.status(404).json({ error: "Bot non trouvé" })
    const logs = await db.query("SELECT * FROM logs WHERE bot_id = $1 ORDER BY created_at DESC LIMIT 100", [bot.id])
    res.json(logs.rows.reverse())
})

router.get("/:id/blacklist", async (req, res) => {
    const result = await db.query("SELECT id FROM bots WHERE id = $1 AND user_id = $2", [req.params.id, req.userId])
    const bot = result.rows[0]
    if (!bot) return res.status(404).json({ error: "Bot non trouvé" })
    const items = await db.query("SELECT * FROM blacklist WHERE bot_id = $1 ORDER BY created_at DESC", [bot.id])
    res.json(items.rows)
})

router.post("/:id/blacklist", async (req, res) => {
    const result = await db.query("SELECT id FROM bots WHERE id = $1 AND user_id = $2", [req.params.id, req.userId])
    const bot = result.rows[0]
    if (!bot) return res.status(404).json({ error: "Bot non trouvé" })
    const { number } = req.body
    if (!number) return res.status(400).json({ error: "Numéro requis" })
    await db.query("INSERT INTO blacklist (bot_id, number) VALUES ($1, $2) ON CONFLICT (bot_id, number) DO NOTHING", [bot.id, number])
    res.json({ ok: true })
})

router.delete("/:id/blacklist/:number", async (req, res) => {
    const result = await db.query("SELECT id FROM bots WHERE id = $1 AND user_id = $2", [req.params.id, req.userId])
    const bot = result.rows[0]
    if (!bot) return res.status(404).json({ error: "Bot non trouvé" })
    await db.query("DELETE FROM blacklist WHERE bot_id = $1 AND number = $2", [bot.id, req.params.number])
    res.json({ ok: true })
})

module.exports = router
