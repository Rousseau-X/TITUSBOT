const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const db = require("../db")

const router = express.Router()
const SECRET = process.env.JWT_SECRET || "botdash_secret_key"

router.post("/register", async (req, res) => {
    const { email, password, name } = req.body
    if (!email || !password) return res.status(400).json({ error: "Email et mot de passe requis" })
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email)
    if (existing) return res.status(409).json({ error: "Email déjà utilisé" })
    const hash = await bcrypt.hash(password, 10)
    const result = db.prepare("INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)").run(email, hash, name || "")
    const token = jwt.sign({ userId: result.lastInsertRowid }, SECRET, { expiresIn: "7d" })
    res.json({ token, user: { id: result.lastInsertRowid, email, name: name || "" } })
})

router.post("/login", async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: "Email et mot de passe requis" })
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email)
    if (!user) return res.status(401).json({ error: "Identifiants invalides" })
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return res.status(401).json({ error: "Identifiants invalides" })
    const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: "7d" })
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } })
})

router.get("/me", require("../middleware/auth"), (req, res) => {
    const user = db.prepare("SELECT id, email, name, created_at FROM users WHERE id = ?").get(req.userId)
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" })
    res.json(user)
})

module.exports = router
