import { useState, useEffect, useRef } from "react"
import { useParams, Link, useNavigate, useLocation } from "react-router-dom"
import { io } from "socket.io-client"
import { ChevronLeft, TerminalSquare, Settings, Command, Power, PhoneOff, AlertCircle, Wifi, RefreshCw, Activity, QrCode, Hash } from "lucide-react"
import { bots as botsApi } from "../api/client"

export default function BotDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const [bot, setBot] = useState(null)
    const [logs, setLogs] = useState([])
    const [qr, setQr] = useState(null)
    const [pairCode, setPairCode] = useState(null)
    const [phone, setPhone] = useState("")
    const [method, setMethod] = useState("pair")
    const [connecting, setConnecting] = useState(false)
    const [loading, setLoading] = useState(true)
    const socketRef = useRef(null)
    const logsEndRef = useRef(null)

    useEffect(() => {
        botsApi.get(id).then(b => { setBot(b); setPhone(b.phone || "") }).finally(() => setLoading(false))
        botsApi.logs(id).then(setLogs)

        const token = localStorage.getItem("token")
        const socket = io("/", { auth: { token } })
        socketRef.current = socket
        socket.emit("join-bot", parseInt(id))

        socket.on("qr", ({ botId, qr: code }) => { if (botId == id) setQr(code) })
        socket.on("pair-code", ({ botId, code }) => { if (botId == id) setPairCode(code) })
        socket.on("bot-status", ({ botId, status }) => {
            if (botId == id) {
                setBot(b => b ? { ...b, status } : b)
                if (status === "connected") { setQr(null); setPairCode(null) }
            }
        })
        socket.on("log", ({ botId, level, message, timestamp }) => {
            if (botId == id) setLogs(l => [...l.slice(-199), { level, message, created_at: timestamp }])
        })

        return () => { socket.emit("leave-bot", parseInt(id)); socket.disconnect() }
    }, [id])

    useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [logs])

    const connect = async () => {
        setConnecting(true)
        setQr(null)
        setPairCode(null)
        try {
            const payload = method === "pair" ? { phone } : {}
            await botsApi.connect(id, payload)
        } finally {
            setConnecting(false)
        }
    }

    const disconnect = async () => {
        await botsApi.disconnect(id)
        setBot(b => b ? { ...b, status: "disconnected" } : b)
        setQr(null)
        setPairCode(null)
    }

    const isConnecting = connecting || bot?.status === "connecting"

    if (loading) return <div className="app-loading"><div className="spinner" /></div>
    if (!bot) return <div className="app-loading" style={{ color: "var(--danger)" }}>Bot not found</div>

    const getLogColor = (level) => {
        switch(level) {
            case "error": return "var(--danger)";
            case "warn": return "var(--warning)";
            case "success": return "var(--accent)";
            default: return "var(--text-main)";
        }
    }

    return (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <button onClick={() => navigate("/bots")} className="btn-ghost" style={{ padding: "0.5rem", borderRadius: "8px" }}>
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
                            <h1 style={{ fontSize: "1.5rem", lineHeight: 1 }}>{bot.name}</h1>
                            <div className={`badge badge-${bot.status}`}>
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", marginRight: "0.375rem" }}></span>
                                {bot.status}
                            </div>
                        </div>
                        <div className="mono" style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{bot.phone || "No phone linked"}</div>
                    </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", background: "var(--bg-surface)", padding: "0.25rem", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                    <Link to={`/bots/${id}`} className={`btn ${location.pathname === `/bots/${id}` ? "btn-secondary" : "btn-ghost"}`} style={{ padding: "0.5rem 1rem", border: "none" }}>
                        <Activity size={16} /> Overview
                    </Link>
                    <Link to={`/bots/${id}/commands`} className={`btn ${location.pathname.includes('/commands') ? "btn-secondary" : "btn-ghost"}`} style={{ padding: "0.5rem 1rem", border: "none" }}>
                        <Command size={16} /> Commands
                    </Link>
                    <Link to={`/bots/${id}/config`} className={`btn ${location.pathname.includes('/config') ? "btn-secondary" : "btn-ghost"}`} style={{ padding: "0.5rem 1rem", border: "none" }}>
                        <Settings size={16} /> Config
                    </Link>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                {/* Connection Card */}
                <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#fff" }}>
                        <Wifi size={20} />
                        <h2 style={{ fontSize: "1.125rem" }}>Connexion WhatsApp</h2>
                    </div>

                    {bot.status === "connected" ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "1.5rem", padding: "2rem 0" }}>
                            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", border: "2px solid var(--accent-muted)", position: "relative" }}>
                                <div style={{ position: "absolute", width: "100%", height: "100%", borderRadius: "50%", border: "2px solid var(--accent)", borderTopColor: "transparent", animation: "spin 3s linear infinite", opacity: 0.5 }}></div>
                                <Activity size={40} />
                            </div>
                            <div>
                                <div style={{ fontSize: "1.25rem", fontWeight: 600, color: "#fff", marginBottom: "0.5rem" }}>Session Active</div>
                                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", maxWidth: 260 }}>Bot connecté et opérationnel.</p>
                            </div>
                            <button onClick={disconnect} className="btn btn-danger" style={{ width: "100%", maxWidth: 200 }}>
                                <PhoneOff size={16} /> Déconnecter
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

                            {/* Method Toggle */}
                            <div style={{ display: "flex", background: "var(--bg-base)", borderRadius: "10px", padding: "4px", border: "1px solid var(--border-subtle)" }}>
                                <button
                                    onClick={() => { setMethod("pair"); setQr(null); setPairCode(null) }}
                                    style={{
                                        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                                        padding: "0.6rem 0.75rem", borderRadius: "7px", border: "none", cursor: "pointer",
                                        fontWeight: 600, fontSize: "0.875rem", transition: "all 0.15s",
                                        background: method === "pair" ? "var(--accent)" : "transparent",
                                        color: method === "pair" ? "#000" : "var(--text-muted)"
                                    }}
                                >
                                    <Hash size={15} />
                                    Pair Code
                                </button>
                                <button
                                    onClick={() => { setMethod("qr"); setQr(null); setPairCode(null) }}
                                    style={{
                                        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                                        padding: "0.6rem 0.75rem", borderRadius: "7px", border: "none", cursor: "pointer",
                                        fontWeight: 600, fontSize: "0.875rem", transition: "all 0.15s",
                                        background: method === "qr" ? "var(--accent)" : "transparent",
                                        color: method === "qr" ? "#000" : "var(--text-muted)"
                                    }}
                                >
                                    <QrCode size={15} />
                                    QR Code
                                </button>
                            </div>

                            {/* Phone input — only for pair code */}
                            {method === "pair" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                    <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-muted)" }}>Numéro de téléphone</label>
                                    <input
                                        placeholder="ex: 22900000000"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        className="mono"
                                        style={{ width: "100%" }}
                                    />
                                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                                        Format international sans +. Ex : 33612345678
                                    </div>
                                </div>
                            )}

                            {/* QR info */}
                            {method === "qr" && !qr && !isConnecting && (
                                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "1rem", background: "var(--bg-base)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                                    <AlertCircle size={18} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: "0.125rem" }} />
                                    <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                                        Un QR code sera généré. Scanne-le depuis WhatsApp → <strong>Appareils liés</strong>.
                                    </div>
                                </div>
                            )}

                            {/* Connect button */}
                            <button
                                onClick={connect}
                                disabled={isConnecting || (method === "pair" && !phone.trim())}
                                className="btn btn-primary"
                                style={{ width: "100%" }}
                            >
                                {isConnecting
                                    ? <><RefreshCw size={16} className="animate-spin" /> Connexion en cours...</>
                                    : <><Power size={16} /> {method === "pair" ? "Obtenir le Pair Code" : "Générer le QR Code"}</>
                                }
                            </button>

                            {/* Pair code result */}
                            {pairCode && (
                                <div className="animate-fade-in" style={{ padding: "1.5rem", background: "var(--bg-base)", borderRadius: "10px", border: "1px solid var(--border-strong)", textAlign: "center", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Code de couplage</div>
                                    <div className="mono" style={{ fontSize: "2.25rem", fontWeight: 700, letterSpacing: "0.25em", color: "var(--accent)" }}>
                                        {pairCode}
                                    </div>
                                    <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                                        Sur WhatsApp : <strong style={{ color: "var(--text-main)" }}>Appareils liés → Associer un appareil → Saisir le code</strong>
                                    </div>
                                </div>
                            )}

                            {/* QR code result */}
                            {qr && (
                                <div className="animate-fade-in" style={{ padding: "1.25rem", background: "#fff", borderRadius: "10px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
                                    <div style={{ fontSize: "0.8125rem", color: "#555", fontWeight: 500 }}>Scanne avec WhatsApp</div>
                                    <div style={{ padding: "0.5rem", border: "1px solid #eee", borderRadius: "8px" }}>
                                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qr)}`} alt="QR Code" style={{ display: "block", width: 200, height: 200 }} />
                                    </div>
                                    <div style={{ fontSize: "0.75rem", color: "#888" }}>WhatsApp → Appareils liés → Scanner</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Terminal Card */}
                <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem", height: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#fff" }}>
                        <TerminalSquare size={20} />
                        <h2 style={{ fontSize: "1.125rem" }}>Logs en direct</h2>
                    </div>
                    
                    <div className="scroll-y mono" style={{ flex: 1, background: "var(--bg-base)", borderRadius: "8px", padding: "1rem", border: "1px solid var(--border-strong)", fontSize: "0.8125rem", minHeight: 300, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        {logs.length === 0 ? (
                            <div style={{ color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", margin: "auto" }}>En attente de logs...</div>
                        ) : (
                            logs.map((log, i) => (
                                <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                                    <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>[{new Date(log.created_at).toLocaleTimeString()}]</span>
                                    <span style={{ color: getLogColor(log.level), wordBreak: "break-word" }}>{log.message}</span>
                                </div>
                            ))
                        )}
                        <div ref={logsEndRef} />
                    </div>
                </div>
            </div>
        </div>
    )
}
