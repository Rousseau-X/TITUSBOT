const express = require("express")
const db = require("../db")

const router = express.Router()

router.get("/:id/stats", (req, res) => {
    const bot = db.prepare("SELECT * FROM bots WHERE id = ? AND user_id = ?").get(req.params.id, req.userId)
    if (!bot) return res.status(404).json({ error: "Bot non trouvé" })

    const today = new Date().toISOString().slice(0, 10)
    const todayStats = db.prepare("SELECT * FROM stats WHERE bot_id = ? AND date = ?").get(bot.id, today) || { messages_received: 0, commands_used: 0 }

    const last7 = db.prepare("SELECT * FROM stats WHERE bot_id = ? ORDER BY date DESC LIMIT 7").all(bot.id).reverse()

    const totals = db.prepare("SELECT SUM(messages_received) as total_messages, SUM(commands_used) as total_commands FROM stats WHERE bot_id = ?").get(bot.id)

    const topCommands = db.prepare(`
        SELECT name, description FROM commands 
        WHERE bot_id = ? AND enabled = 1 AND type = 'builtin'
        ORDER BY name ASC LIMIT 10
    `).all(bot.id)

    const totalCommands = db.prepare("SELECT COUNT(*) as count FROM commands WHERE bot_id = ?").get(bot.id)
    const enabledCommands = db.prepare("SELECT COUNT(*) as count FROM commands WHERE bot_id = ? AND enabled = 1").get(bot.id)

    res.json({
        today: todayStats,
        last7,
        totals: totals || { total_messages: 0, total_commands: 0 },
        topCommands,
        totalCommands: totalCommands.count,
        enabledCommands: enabledCommands.count,
        status: bot.status
    })
})

router.get("/overview", (req, res) => {
    const bots = db.prepare("SELECT * FROM bots WHERE user_id = ?").all(req.userId)
    const today = new Date().toISOString().slice(0, 10)

    let totalMessages = 0
    let totalCommands = 0
    let connectedBots = 0

    for (const bot of bots) {
        const s = db.prepare("SELECT * FROM stats WHERE bot_id = ? AND date = ?").get(bot.id, today)
        if (s) {
            totalMessages += s.messages_received || 0
            totalCommands += s.commands_used || 0
        }
        if (bot.status === "connected") connectedBots++
    }

    res.json({
        totalBots: bots.length,
        connectedBots,
        todayMessages: totalMessages,
        todayCommands: totalCommands
    })
})

module.exports = router
