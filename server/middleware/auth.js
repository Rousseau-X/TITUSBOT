const jwt = require("jsonwebtoken")

module.exports = (req, res, next) => {
    const auth = req.headers.authorization
    if (!auth || !auth.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" })
    }
    const token = auth.slice(7)
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || "botdash_secret_key")
        req.userId = payload.userId
        next()
    } catch {
        return res.status(401).json({ error: "Invalid token" })
    }
}
