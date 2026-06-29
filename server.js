const express = require("express")
const { createServer } = require("http")
const { Server } = require("socket.io")
const cors = require("cors")
const path = require("path")

const db = require("./server/db")
const authMiddleware = require("./server/middleware/auth")
const authRoutes = require("./server/routes/auth")
const botsRoutes = require("./server/routes/bots")
const commandsRoutes = require("./server/routes/commands")
const statsRoutes = require("./server/routes/stats")
const configRoutes = require("./server/routes/config")
const { setIo } = require("./server/botManager")

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
})

setIo(io)

app.use(cors())
app.use(express.json())

app.use("/api/auth", authRoutes)
app.use("/api/bots", authMiddleware, botsRoutes)
app.use("/api/bots", authMiddleware, commandsRoutes)
app.use("/api/bots", authMiddleware, statsRoutes)
app.use("/api/bots", authMiddleware, configRoutes)

app.get("/api/health", (req, res) => res.json({ ok: true }))

io.use((socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) return next(new Error("No token"))
    try {
        const jwt = require("jsonwebtoken")
        const payload = jwt.verify(token, process.env.JWT_SECRET || "botdash_secret_key")
        socket.userId = payload.userId
        next()
    } catch {
        next(new Error("Invalid token"))
    }
})

io.on("connection", (socket) => {
    console.log(`Socket connected: user ${socket.userId}`)
    socket.join(`user:${socket.userId}`)

    socket.on("join-bot", (botId) => {
        socket.join(`bot:${botId}`)
    })

    socket.on("leave-bot", (botId) => {
        socket.leave(`bot:${botId}`)
    })

    socket.on("disconnect", () => {
        console.log(`Socket disconnected: user ${socket.userId}`)
    })
})

const PORT = process.env.API_PORT || 8000
httpServer.listen(PORT, "localhost", () => {
    console.log(`🚀 BotDash API running on port ${PORT}`)
})
