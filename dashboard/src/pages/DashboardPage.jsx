import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Bot, MessageSquare, Terminal, Activity, ArrowRight, Plus } from "lucide-react"
import { bots as botsApi, stats as statsApi } from "../api/client"

export default function DashboardPage() {
    const [overview, setOverview] = useState(null)
    const [botList, setBotList] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([statsApi.overview(), botsApi.list()])
            .then(([ov, bl]) => { setOverview(ov); setBotList(bl) })
            .finally(() => setLoading(false))
    }, [])

    if (loading) return (
        <div className="app-loading">
            <div className="spinner" />
            <div style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Loading dashboard...</div>
        </div>
    )

    const stats = [
        { label: "Total Bots", value: overview?.totalBots ?? 0, icon: <Bot size={20} />, color: "var(--info)" },
        { label: "Connected", value: overview?.connectedBots ?? 0, icon: <Activity size={20} />, color: "var(--accent)" },
        { label: "Messages Today", value: (overview?.todayMessages ?? 0).toLocaleString(), icon: <MessageSquare size={20} />, color: "var(--text-main)" },
        { label: "Commands Today", value: (overview?.todayCommands ?? 0).toLocaleString(), icon: <Terminal size={20} />, color: "var(--warning)" },
    ]

    return (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                    <h1 style={{ fontSize: "1.875rem", marginBottom: "0.25rem" }}>Dashboard Overview</h1>
                    <p style={{ color: "var(--text-muted)" }}>Real-time metrics for your WhatsApp bots.</p>
                </div>
                <Link to="/bots" className="btn btn-primary">
                    <Plus size={18} />
                    New Bot
                </Link>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
                {stats.map((stat, i) => (
                    <div key={i} className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-muted)" }}>{stat.label}</span>
                            <div style={{ color: stat.color, opacity: 0.8 }}>{stat.icon}</div>
                        </div>
                        <div style={{ fontSize: "2rem", fontWeight: 700, color: "#fff", lineHeight: 1 }}>{stat.value}</div>
                    </div>
                ))}
            </div>

            <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                    <h2 style={{ fontSize: "1.25rem" }}>Active Bots</h2>
                    <Link to="/bots" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: 500 }}>
                        View all <ArrowRight size={16} />
                    </Link>
                </div>
                
                {botList.length === 0 ? (
                    <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "3rem 1.5rem", textAlign: "center", gap: "1rem" }}>
                        <div style={{ width: 48, height: 48, background: "var(--bg-surface-hover)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                            <Bot size={24} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, color: "#fff", marginBottom: "0.25rem" }}>No bots configured</div>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Create your first WhatsApp bot to get started.</div>
                        </div>
                        <Link to="/bots" className="btn btn-primary" style={{ marginTop: "0.5rem" }}>Create Bot</Link>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
                        {botList.slice(0, 6).map(bot => (
                            <Link key={bot.id} to={`/bots/${bot.id}`} style={{ display: "block" }}>
                                <div className="card" style={{ transition: "all 0.2s", ":hover": { borderColor: "var(--border-strong)", transform: "translateY(-2px)" } }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                            <div style={{ width: 36, height: 36, background: "var(--bg-base)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", border: "1px solid var(--border-subtle)" }}>
                                                <Bot size={20} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, color: "#fff", lineHeight: 1.2, marginBottom: "0.25rem" }}>{bot.name}</div>
                                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{bot.phone || "No phone linked"}</div>
                                            </div>
                                        </div>
                                        <div className={`badge badge-${bot.status}`}>
                                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", marginRight: "0.375rem" }}></span>
                                            {bot.status}
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "1rem", borderTop: "1px solid var(--border-subtle)" }}>
                                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>ID: {bot.id}</span>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.875rem", color: "var(--accent)" }}>
                                            Manage <ArrowRight size={14} />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
