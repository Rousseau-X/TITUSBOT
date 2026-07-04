const express = require("express")
const db = require("../db")

const router = express.Router()

router.get("/:id/commands", async (req, res) => {
    const result = await db.query("SELECT id FROM bots WHERE id = $1 AND user_id = $2", [req.params.id, req.userId])
    const bot = result.rows[0]
    if (!bot) return res.status(404).json({ error: "Bot non trouvé" })
    const cmds = await db.query("SELECT * FROM commands WHERE bot_id = $1 ORDER BY type ASC, name ASC", [bot.id])
    res.json(cmds.rows)
})

router.put("/:id/commands/:name/toggle", async (req, res) => {
    const result = await db.query("SELECT id FROM bots WHERE id = $1 AND user_id = $2", [req.params.id, req.userId])
    const bot = result.rows[0]
    if (!bot) return res.status(404).json({ error: "Bot non trouvé" })
    const cmdResult = await db.query("SELECT * FROM commands WHERE bot_id = $1 AND name = $2", [bot.id, req.params.name])
    const cmd = cmdResult.rows[0]
    if (!cmd) return res.status(404).json({ error: "Commande non trouvée" })
    const newState = cmd.enabled ? 0 : 1
    await db.query("UPDATE commands SET enabled = $1 WHERE id = $2", [newState, cmd.id])
    res.json({ ...cmd, enabled: newState })
})

router.post("/:id/commands", async (req, res) => {
    const result = await db.query("SELECT id FROM bots WHERE id = $1 AND user_id = $2", [req.params.id, req.userId])
    const bot = result.rows[0]
    if (!bot) return res.status(404).json({ error: "Bot non trouvé" })
    const { name, response, description } = req.body
    if (!name || !response) return res.status(400).json({ error: "Nom et réponse requis" })
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, "")
    try {
        const inserted = await db.query(
            "INSERT INTO commands (bot_id, name, enabled, type, response, description) VALUES ($1, $2, 1, 'custom', $3, $4) RETURNING id",
            [bot.id, cleanName, response, description || ""]
        )
        const cmd = await db.query("SELECT * FROM commands WHERE id = $1", [inserted.rows[0].id])
        res.json(cmd.rows[0])
    } catch {
        res.status(409).json({ error: "Une commande avec ce nom existe déjà" })
    }
})

router.put("/:id/commands/:name", async (req, res) => {
    const result = await db.query("SELECT id FROM bots WHERE id = $1 AND user_id = $2", [req.params.id, req.userId])
    const bot = result.rows[0]
    if (!bot) return res.status(404).json({ error: "Bot non trouvé" })
    const cmdResult = await db.query("SELECT * FROM commands WHERE bot_id = $1 AND name = $2", [bot.id, req.params.name])
    const cmd = cmdResult.rows[0]
    if (!cmd) return res.status(404).json({ error: "Commande non trouvée" })
    const { response, description } = req.body
    await db.query(
        "UPDATE commands SET response = $1, description = $2 WHERE id = $3",
        [response ?? cmd.response, description ?? cmd.description, cmd.id]
    )
    const updated = await db.query("SELECT * FROM commands WHERE id = $1", [cmd.id])
    res.json(updated.rows[0])
})

router.delete("/:id/commands/:name", async (req, res) => {
    const result = await db.query("SELECT id FROM bots WHERE id = $1 AND user_id = $2", [req.params.id, req.userId])
    const bot = result.rows[0]
    if (!bot) return res.status(404).json({ error: "Bot non trouvé" })
    const cmdResult = await db.query("SELECT * FROM commands WHERE bot_id = $1 AND name = $2 AND type = 'custom'", [bot.id, req.params.name])
    const cmd = cmdResult.rows[0]
    if (!cmd) return res.status(404).json({ error: "Commande personnalisée non trouvée" })
    await db.query("DELETE FROM commands WHERE id = $1", [cmd.id])
    res.json({ ok: true })
})

module.exports = router
