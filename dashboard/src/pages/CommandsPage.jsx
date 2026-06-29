import { useState, useEffect } from "react"
import { useParams, Link, useNavigate, useLocation } from "react-router-dom"
import { ChevronLeft, Activity, Command, Settings, Plus, Search, Filter, Trash2, Power } from "lucide-react"
import { commands as cmdApi, bots as botsApi } from "../api/client"

export default function CommandsPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const [bot, setBot] = useState(null)
    const [cmdList, setCmdList] = useState([])
    const [filter, setFilter] = useState("all")
    const [search, setSearch] = useState("")
    const [showCreate, setShowCreate] = useState(false)
    const [newCmd, setNewCmd] = useState({ name: "", response: "", description: "" })
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)

    const load = async () => {
        const [b, cmds] = await Promise.all([botsApi.get(id), cmdApi.list(id)])
        setBot(b); setCmdList(cmds); setLoading(false)
    }
    useEffect(() => { load() }, [id])

    const toggle = async (name) => {
        const updated = await cmdApi.toggle(id, name)
        setCmdList(l => l.map(c => c.name === name ? updated : c))
    }

    const create = async (e) => {
        e.preventDefault()
        setCreating(true)
        try {
            const cmd = await cmdApi.create(id, newCmd)
            setCmdList(l => [...l, cmd])
            setNewCmd({ name: "", response: "", description: "" })
            setShowCreate(false)
        } catch (err) {
            alert(err.error || "Error creating command")
        } finally {
            setCreating(false)
        }
    }

    const remove = async (name) => {
        if (!confirm(`Delete command !${name}?`)) return
        await cmdApi.remove(id, name)
        setCmdList(l => l.filter(c => c.name !== name))
    }

    const filtered = cmdList.filter(c => {
        if (filter === "builtin" && c.type !== "builtin") return false
        if (filter === "custom" && c.type !== "custom") return false
        if (filter === "active" && !c.enabled) return false
        if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
        return true
    })

    if (loading) return <div className="app-loading"><div className="spinner" /></div>

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
                        <div className="mono" style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Command Configuration</div>
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

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <div style={{ position: "relative", width: 240 }}>
                        <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                        <input 
                            placeholder="Search commands..." 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            style={{ width: "100%", paddingLeft: "2.25rem" }} 
                        />
                    </div>
                    <div style={{ display: "flex", background: "var(--bg-surface)", borderRadius: "6px", padding: "0.25rem", border: "1px solid var(--border-subtle)" }}>
                        {["all", "builtin", "custom", "active"].map(f => (
                            <button 
                                key={f} 
                                onClick={() => setFilter(f)} 
                                className={`btn ${filter === f ? "btn-secondary" : "btn-ghost"}`}
                                style={{ padding: "0.375rem 0.75rem", border: "none", fontSize: "0.75rem", textTransform: "capitalize", borderRadius: "4px" }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>{filtered.length} found</span>
                </div>
                {!showCreate && (
                    <button onClick={() => setShowCreate(true)} className="btn btn-primary">
                        <Plus size={16} /> Custom Command
                    </button>
                )}
            </div>

            {showCreate && (
                <div className="card animate-fade-in" style={{ borderLeft: "4px solid var(--accent)" }}>
                    <h3 style={{ fontSize: "1.125rem", marginBottom: "1rem" }}>Create Custom Command</h3>
                    <form onSubmit={create} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-muted)", marginBottom: "0.5rem" }}>Trigger Name</label>
                                <div style={{ position: "relative" }}>
                                    <span className="mono" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>!</span>
                                    <input 
                                        placeholder="hello" 
                                        value={newCmd.name} 
                                        onChange={e => setNewCmd(n => ({ ...n, name: e.target.value.replace(/[^a-zA-Z0-9_-]/g, "") }))} 
                                        required 
                                        style={{ width: "100%", paddingLeft: "1.75rem" }} 
                                        className="mono"
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-muted)", marginBottom: "0.5rem" }}>Description</label>
                                <input 
                                    placeholder="What does this command do?" 
                                    value={newCmd.description} 
                                    onChange={e => setNewCmd(n => ({ ...n, description: e.target.value }))} 
                                    style={{ width: "100%" }} 
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-muted)", marginBottom: "0.5rem" }}>Bot Response</label>
                            <textarea 
                                placeholder="Text response sent by the bot..." 
                                value={newCmd.response} 
                                onChange={e => setNewCmd(n => ({ ...n, response: e.target.value }))} 
                                required 
                                rows={3} 
                                style={{ width: "100%", resize: "vertical" }} 
                            />
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                            <button type="button" onClick={() => setShowCreate(false)} className="btn btn-secondary">Cancel</button>
                            <button type="submit" disabled={creating} className="btn btn-primary" style={{ width: 100 }}>
                                {creating ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : "Create"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
                {filtered.map(cmd => (
                    <div key={cmd.name} className="card" style={{ padding: "1.25rem", opacity: cmd.enabled ? 1 : 0.6, borderLeft: cmd.enabled ? "2px solid var(--accent)" : "2px solid var(--border-strong)", transition: "opacity 0.2s" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <span className="mono" style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--accent)" }}>!{cmd.name}</span>
                                <span style={{ fontSize: "0.6875rem", padding: "0.125rem 0.5rem", borderRadius: "4px", background: cmd.type === "custom" ? "var(--info-dim)" : "var(--bg-base)", color: cmd.type === "custom" ? "var(--info)" : "var(--text-muted)", border: "1px solid", borderColor: cmd.type === "custom" ? "rgba(77,148,255,0.2)" : "var(--border-strong)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                                    {cmd.type}
                                </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <button 
                                    onClick={() => toggle(cmd.name)} 
                                    className={`btn ${cmd.enabled ? "btn-secondary" : "btn-ghost"}`}
                                    style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", gap: "0.375rem" }}
                                >
                                    <Power size={12} color={cmd.enabled ? "var(--accent)" : "currentColor"} />
                                    {cmd.enabled ? "Enabled" : "Disabled"}
                                </button>
                                {cmd.type === "custom" && (
                                    <button 
                                        onClick={() => remove(cmd.name)} 
                                        className="btn-ghost"
                                        style={{ padding: "0.25rem", color: "var(--danger)" }}
                                        title="Delete command"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                        {cmd.description && <div style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: cmd.response ? "0.75rem" : 0 }}>{cmd.description}</div>}
                        {cmd.response && (
                            <div className="mono" style={{ color: "var(--text-main)", fontSize: "0.8125rem", background: "var(--bg-base)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border-subtle)", whiteSpace: "pre-wrap" }}>
                                {cmd.response}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
