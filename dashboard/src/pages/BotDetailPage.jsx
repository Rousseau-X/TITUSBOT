import { useState, useEffect, useRef } from "react"
import { useParams, Link, useNavigate, useLocation } from "react-router-dom"
import { io } from "socket.io-client"
import { ChevronLeft, TerminalSquare, Settings, Command, Power, PhoneOff, AlertCircle, Wifi, RefreshCw, Activity } from "lucide-react"
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
        try { await botsApi.connect(id, { phone }) } finally { setConnecting(false) }
    }

    const disconnect = async () => {
        await botsApi.disconnect(id)
        setBot(b => b ? { ...b, status: "disconnected" } : b)
        setQr(null)
        setPairCode(null)
    }

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
                        <h2 style={{ fontSize: "1.125rem" }}>Connection Status</h2>
                    </div>

                    {bot.status === "connected" ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "1.5rem", padding: "2rem 0" }}>
                            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", border: "2px solid var(--accent-muted)", position: "relative" }}>
                                <div style={{ position: "absolute", width: "100%", height: "100%", borderRadius: "50%", border: "2px solid var(--accent)", borderTopColor: "transparent", animation: "spin 3s linear infinite", opacity: 0.5 }}></div>
                                <Activity size={40} />
                            </div>
                            <div>
                                <div style={{ fontSize: "1.25rem", fontWeight: 600, color: "#fff", marginBottom: "0.5rem" }}>Session Active</div>
                                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", maxWidth: 260 }}>Bot is fully connected and processing messages.</p>
                            </div>
                            <button onClick={disconnect} className="btn btn-danger" style={{ width: "100%", maxWidth: 200 }}>
                                <PhoneOff size={16} /> Disconnect
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-muted)" }}>Target Phone Number</label>
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                    <input 
                                        placeholder="e.g. 22900000000" 
                                        value={phone} 
                                        onChange={e => setPhone(e.target.value)} 
                                        style={{ flex: 1 }} 
                                        className="mono"
                                    />
                                    <button 
                                        onClick={connect} 
                                        disabled={connecting || bot.status === "connecting"} 
                                        className="btn btn-primary"
                                        style={{ width: 120 }}
                                    >
                                        {(connecting || bot.status === "connecting") ? <RefreshCw size={16} className="animate-spin" /> : <Power size={16} />}
                                        {(connecting || bot.status === "connecting") ? "Pairing..." : "Connect"}
                                    </button>
                                </div>
                            </div>

                            {pairCode && (
                                <div className="animate-fade-in" style={{ padding: "1.5rem", background: "var(--bg-base)", borderRadius: "8px", border: "1px solid var(--border-strong)", textAlign: "center", display: "flex", flexDirection: "column", gap: "1rem" }}>
                                    <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Pairing Code</div>
                                    <div className="mono" style={{ fontSize: "2.5rem", fontWeight: 700, letterSpacing: "0.2em", color: "var(--accent)" }}>{pairCode}</div>
                                    <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Enter this code on WhatsApp:<br/>Linked Devices → Link a Device → Link with Phone Number Instead</div>
                                </div>
                            )}

                            {qr && (
                                <div className="animate-fade-in" style={{ padding: "1.5rem", background: "#fff", borderRadius: "8px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                                    <div style={{ fontSize: "0.875rem", color: "#666", fontWeight: 500 }}>Scan QR Code with WhatsApp</div>
                                    <div style={{ padding: "0.5rem", border: "1px solid #eee", borderRadius: "8px" }}>
                                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qr)}`} alt="QR Code" style={{ display: "block", width: 200, height: 200 }} />
                                    </div>
                                </div>
                            )}

                            {!pairCode && !qr && bot.status !== "connecting" && (
                                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "1rem", background: "var(--bg-base)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                                    <AlertCircle size={20} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: "0.125rem" }} />
                                    <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                                        Enter the phone number for the WhatsApp account you want this bot to control, then click Connect to generate a pairing code.
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Terminal Card */}
                <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem", height: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#fff" }}>
                        <TerminalSquare size={20} />
                        <h2 style={{ fontSize: "1.125rem" }}>Live Logs</h2>
                    </div>
                    
                    <div className="scroll-y mono" style={{ flex: 1, background: "var(--bg-base)", borderRadius: "8px", padding: "1rem", border: "1px solid var(--border-strong)", fontSize: "0.8125rem", minHeight: 300, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        {logs.length === 0 ? (
                            <div style={{ color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", margin: "auto" }}>Waiting for logs...</div>
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
