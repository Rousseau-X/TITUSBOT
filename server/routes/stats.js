const express = require("express")
const db = require("../db")

const router = express.Router()

router.get("/:id/stats", async (req, res) => {
    const result = await db.query("SELECT * FROM bots WHERE id = $1 AND user_id = $2", [req.params.id, req.userId])
    const bot = result.rows[0]
    if (!bot) return res.status(404).json({ error: "Bot non trouvé" })

    const today = new Date().toISOString().slice(0, 10)
    const todayStatsResult = await db.query("SELECT * FROM stats WHERE bot_id = $1 AND date = $2", [bot.id, today])
    const todayStats = todayStatsResult.rows[0] || { messages_received: 0, commands_used: 0 }

    const last7Result = await db.query("SELECT * FROM stats WHERE bot_id = $1 ORDER BY date DESC LIMIT 7", [bot.id])
    const last7 = last7Result.rows.reverse()

    const totalsResult = await db.query(
        "SELECT SUM(messages_received) as total_messages, SUM(commands_used) as total_commands FROM stats WHERE bot_id = $1",
        [bot.id]
    )
    const totals = totalsResult.rows[0]

    const topCommandsResult = await db.query(
        `SELECT name, description FROM commands 
        WHERE bot_id = $1 AND enabled = 1 AND type = 'builtin'
        ORDER BY name ASC LIMIT 10`,
        [bot.id]
    )

    const totalCommandsResult = await db.query("SELECT COUNT(*) as count FROM commands WHERE bot_id = $1", [bot.id])
    const enabledCommandsResult = await db.query("SELECT COUNT(*) as count FROM commands WHERE bot_id = $1 AND enabled = 1", [bot.id])

    res.json({
        today: todayStats,
        last7,
        totals: (totals && totals.total_messages !== null) ? totals : { total_messages: 0, total_commands: 0 },
        topCommands: topCommandsResult.rows,
        totalCommands: Number(totalCommandsResult.rows[0].count),
        enabledCommands: Number(enabledCommandsResult.rows[0].count),
        status: bot.status
    })
})

router.get("/overview", async (req, res) => {
    const botsResult = await db.query("SELECT * FROM bots WHERE user_id = $1", [req.userId])
    const bots = botsResult.rows
    const today = new Date().toISOString().slice(0, 10)

    let totalMessages = 0
    let totalCommands = 0
    let connectedBots = 0

    for (const bot of bots) {
        const sResult = await db.query("SELECT * FROM stats WHERE bot_id = $1 AND date = $2", [bot.id, today])
        const s = sResult.rows[0]
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
