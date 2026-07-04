const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const db = require("../db")

const router = express.Router()
const SECRET = process.env.JWT_SECRET || "botdash_secret_key"

router.post("/register", async (req, res) => {
    try {
        const { email, password, name } = req.body
        if (!email || !password) return res.status(400).json({ error: "Email et mot de passe requis" })
        const existing = await db.query("SELECT id FROM users WHERE email = $1", [email])
        if (existing.rows[0]) return res.status(409).json({ error: "Email déjà utilisé" })
        const hash = await bcrypt.hash(password, 10)
        const result = await db.query(
            "INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id",
            [email, hash, name || ""]
        )
        const userId = result.rows[0].id
        const token = jwt.sign({ userId }, SECRET, { expiresIn: "7d" })
        res.json({ token, user: { id: userId, email, name: name || "" } })
    } catch (e) {
        res.status(500).json({ error: "Erreur serveur" })
    }
})

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) return res.status(400).json({ error: "Email et mot de passe requis" })
        const result = await db.query("SELECT * FROM users WHERE email = $1", [email])
        const user = result.rows[0]
        if (!user) return res.status(401).json({ error: "Identifiants invalides" })
        const valid = await bcrypt.compare(password, user.password_hash)
        if (!valid) return res.status(401).json({ error: "Identifiants invalides" })
        const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: "7d" })
        res.json({ token, user: { id: user.id, email: user.email, name: user.name } })
    } catch (e) {
        res.status(500).json({ error: "Erreur serveur" })
    }
})

router.get("/me", require("../middleware/auth"), async (req, res) => {
    try {
        const result = await db.query("SELECT id, email, name, created_at FROM users WHERE id = $1", [req.userId])
        const user = result.rows[0]
        if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" })
        res.json(user)
    } catch (e) {
        res.status(500).json({ error: "Erreur serveur" })
    }
})

module.exports = router
