const express = require("express")
const db = require("../db")

const router = express.Router()

router.get("/:id/commands", (req, res) => {
    const bot = db.prepare("SELECT id FROM bots WHERE id = ? AND user_id = ?").get(req.params.id, req.userId)
    if (!bot) return res.status(404).json({ error: "Bot non trouvé" })
    const cmds = db.prepare("SELECT * FROM commands WHERE bot_id = ? ORDER BY type ASC, name ASC").all(bot.id)
    res.json(cmds)
})

router.put("/:id/commands/:name/toggle", (req, res) => {
    const bot = db.prepare("SELECT id FROM bots WHERE id = ? AND user_id = ?").get(req.params.id, req.userId)
    if (!bot) return res.status(404).json({ error: "Bot non trouvé" })
    const cmd = db.prepare("SELECT * FROM commands WHERE bot_id = ? AND name = ?").get(bot.id, req.params.name)
    if (!cmd) return res.status(404).json({ error: "Commande non trouvée" })
    const newState = cmd.enabled ? 0 : 1
    db.prepare("UPDATE commands SET enabled = ? WHERE id = ?").run(newState, cmd.id)
    res.json({ ...cmd, enabled: newState })
})

router.post("/:id/commands", (req, res) => {
    const bot = db.prepare("SELECT id FROM bots WHERE id = ? AND user_id = ?").get(req.params.id, req.userId)
    if (!bot) return res.status(404).json({ error: "Bot non trouvé" })
    const { name, response, description } = req.body
    if (!name || !response) return res.status(400).json({ error: "Nom et réponse requis" })
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, "")
    try {
        const result = db.prepare("INSERT INTO commands (bot_id, name, enabled, type, response, description) VALUES (?, ?, 1, 'custom', ?, ?)").run(bot.id, cleanName, response, description || "")
        const cmd = db.prepare("SELECT * FROM commands WHERE id = ?").get(result.lastInsertRowid)
        res.json(cmd)
    } catch {
        res.status(409).json({ error: "Une commande avec ce nom existe déjà" })
    }
})

router.put("/:id/commands/:name", (req, res) => {
    const bot = db.prepare("SELECT id FROM bots WHERE id = ? AND user_id = ?").get(req.params.id, req.userId)
    if (!bot) return res.status(404).json({ error: "Bot non trouvé" })
    const cmd = db.prepare("SELECT * FROM commands WHERE bot_id = ? AND name = ?").get(bot.id, req.params.name)
    if (!cmd) return res.status(404).json({ error: "Commande non trouvée" })
    const { response, description } = req.body
    db.prepare("UPDATE commands SET response = ?, description = ? WHERE id = ?").run(
        response ?? cmd.response,
        description ?? cmd.description,
        cmd.id
    )
    const updated = db.prepare("SELECT * FROM commands WHERE id = ?").get(cmd.id)
    res.json(updated)
})

router.delete("/:id/commands/:name", (req, res) => {
    const bot = db.prepare("SELECT id FROM bots WHERE id = ? AND user_id = ?").get(req.params.id, req.userId)
    if (!bot) return res.status(404).json({ error: "Bot non trouvé" })
    const cmd = db.prepare("SELECT * FROM commands WHERE bot_id = ? AND name = ? AND type = 'custom'").get(bot.id, req.params.name)
    if (!cmd) return res.status(404).json({ error: "Commande personnalisée non trouvée" })
    db.prepare("DELETE FROM commands WHERE id = ?").run(cmd.id)
    res.json({ ok: true })
})

module.exports = router
