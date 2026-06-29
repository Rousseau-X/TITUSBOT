import { useState, useEffect } from "react"
import { useParams, Link, useNavigate, useLocation } from "react-router-dom"
import { ChevronLeft, Activity, Command, Settings, Save, Shield, MessageSquare, Hash } from "lucide-react"
import { config as configApi, bots as botsApi } from "../api/client"

export default function ConfigPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const [bot, setBot] = useState(null)
    const [cfg, setCfg] = useState(null)
    const [blacklist, setBlacklist] = useState([])
    const [newNumber, setNewNumber] = useState("")
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([botsApi.get(id), configApi.get(id), botsApi.blacklist(id)])
            .then(([b, c, bl]) => { setBot(b); setCfg(c); setBlacklist(bl) })
            .finally(() => setLoading(false))
    }, [id])

    const save = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            await configApi.update(id, cfg)
            setSaved(true)
            setTimeout(() => setSaved(false), 2500)
        } finally {
            setSaving(false)
        }
    }

    const addBl = async (e) => {
        e.preventDefault()
        if (!newNumber) return
        await botsApi.addBlacklist(id, newNumber)
        setBlacklist(bl => [...bl, { number: newNumber }])
        setNewNumber("")
    }

    const removeBl = async (number) => {
        await botsApi.removeBlacklist(id, number)
        setBlacklist(bl => bl.filter(b => b.number !== number))
    }

    if (loading || !cfg) return <div className="app-loading"><div className="spinner" /></div>

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
                            <h1 style={{ fontSize: "1.5rem", lineHeight: 1 }}>{bot?.name}</h1>
                            <div className={`badge badge-${bot?.status}`}>
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", marginRight: "0.375rem" }}></span>
                                {bot?.status}
                            </div>
                        </div>
                        <div className="mono" style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Bot Configuration</div>
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

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: "2rem", alignItems: "start" }}>
                <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div className="card">
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem", color: "#fff" }}>
                            <Settings size={20} />
                            <h2 style={{ fontSize: "1.125rem" }}>General Settings</h2>
                        </div>
                        
                        <div>
                            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-muted)", marginBottom: "0.5rem" }}>Command Prefix</label>
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                <input 
                                    value={cfg.prefix} 
                                    onChange={e => setCfg(c => ({ ...c, prefix: e.target.value }))} 
                                    maxLength={3} 
                                    style={{ width: "100px", textAlign: "center", fontSize: "1.25rem" }} 
                                    className="mono"
                                />
                                <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Character used to trigger commands (e.g. `!`, `/`, `.`)</span>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem", color: "#fff" }}>
                            <MessageSquare size={20} />
                            <h2 style={{ fontSize: "1.125rem" }}>Automated Messages</h2>
                        </div>
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                            <div>
                                <label style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                                    <span>Welcome Message</span>
                                    <span className="mono" style={{ fontSize: "0.75rem", color: "var(--info)" }}>Variables: {'{name}, {group}'}</span>
                                </label>
                                <textarea 
                                    value={cfg.welcome_msg || ""} 
                                    onChange={e => setCfg(c => ({ ...c, welcome_msg: e.target.value }))} 
                                    rows={3} 
                                    placeholder="Welcome to the group, {name}!"
                                    style={{ width: "100%", resize: "vertical" }} 
                                />
                            </div>
                            
                            <div>
                                <label style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                                    <span>Goodbye Message</span>
                                    <span className="mono" style={{ fontSize: "0.75rem", color: "var(--info)" }}>Variables: {'{name}, {group}'}</span>
                                </label>
                                <textarea 
                                    value={cfg.goodbye_msg || ""} 
                                    onChange={e => setCfg(c => ({ ...c, goodbye_msg: e.target.value }))} 
                                    rows={2} 
                                    placeholder="Goodbye {name}, sad to see you go."
                                    style={{ width: "100%", resize: "vertical" }} 
                                />
                            </div>

                            <hr style={{ border: "none", borderTop: "1px solid var(--border-subtle)", margin: "0.5rem 0" }} />

                            <div>
                                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-muted)", marginBottom: "0.5rem" }}>Global Auto-Reply</label>
                                <textarea 
                                    value={cfg.auto_reply || ""} 
                                    onChange={e => setCfg(c => ({ ...c, auto_reply: e.target.value }))} 
                                    rows={2} 
                                    placeholder="Leave empty to disable. This responds to ALL incoming messages."
                                    style={{ width: "100%", resize: "vertical" }} 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem", color: "#fff" }}>
                            <Shield size={20} />
                            <h2 style={{ fontSize: "1.125rem" }}>Security</h2>
                        </div>
                        
                        <label style={{ display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer", background: "var(--bg-base)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                            <input 
                                type="checkbox" 
                                checked={!!cfg.anti_spam} 
                                onChange={e => setCfg(c => ({ ...c, anti_spam: e.target.checked }))} 
                                style={{ width: 18, height: 18, accentColor: "var(--accent)" }}
                            />
                            <div>
                                <div style={{ fontWeight: 500, color: "#fff", marginBottom: "0.25rem" }}>Anti-Spam Protection</div>
                                <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Automatically ignore users who send messages too rapidly.</div>
                            </div>
                        </label>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button type="submit" disabled={saving} className={`btn ${saved ? "btn-secondary" : "btn-primary"}`} style={{ minWidth: 160, padding: "0.875rem", fontSize: "1rem", borderColor: saved ? "var(--accent)" : "transparent", color: saved ? "var(--accent)" : undefined }}>
                            {saving ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : saved ? "Saved Successfully" : <><Save size={18} /> Save Configuration</>}
                        </button>
                    </div>
                </form>

                {/* Sidebar */}
                <div className="card" style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem", color: "#fff" }}>
                        <Hash size={20} />
                        <h2 style={{ fontSize: "1.125rem" }}>Blacklist</h2>
                    </div>
                    <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>The bot will completely ignore messages from these numbers.</p>

                    <form onSubmit={addBl} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
                        <input 
                            placeholder="Number (e.g. 229...)" 
                            value={newNumber} 
                            onChange={e => setNewNumber(e.target.value)} 
                            style={{ flex: 1 }} 
                            className="mono"
                        />
                        <button type="submit" className="btn btn-secondary">Add</button>
                    </form>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {blacklist.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-muted)", fontSize: "0.875rem", border: "1px dashed var(--border-strong)", borderRadius: "8px" }}>
                                No blocked numbers
                            </div>
                        ) : (
                            blacklist.map(item => (
                                <div key={item.number} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", background: "var(--bg-base)", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
                                    <span className="mono" style={{ color: "var(--text-main)", fontSize: "0.875rem" }}>{item.number}</span>
                                    <button 
                                        onClick={() => removeBl(item.number)} 
                                        className="btn-ghost" 
                                        style={{ padding: "0.25rem", color: "var(--danger)" }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
