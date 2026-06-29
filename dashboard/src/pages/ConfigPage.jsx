import { useState, useEffect } from "react"
import { useParams, Link, useNavigate, useLocation } from "react-router-dom"
import { ChevronLeft, Activity, Command, Settings, Save, Shield, MessageSquare, Hash } from "lucide-react"
import { config as configApi, bots as botsApi } from "../api/client"
import { useLang } from "../i18n/LangContext"

export default function ConfigPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const { t } = useLang()
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

    const tabLinks = [
        { to: `/bots/${id}`, icon: <Activity size={16} />, label: t("overview"), exact: true },
        { to: `/bots/${id}/commands`, icon: <Command size={16} />, label: t("commands") },
        { to: `/bots/${id}/config`, icon: <Settings size={16} />, label: t("config") },
    ]

    return (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Header */}
            <div style={{ borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                    <button onClick={() => navigate("/bots")} className="btn-ghost" style={{ padding: "0.5rem", borderRadius: "8px", flexShrink: 0 }}>
                        <ChevronLeft size={24} />
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                            <h1 style={{ fontSize: "1.5rem", lineHeight: 1 }}>{bot?.name}</h1>
                            <div className={`badge badge-${bot?.status}`}>
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", marginRight: "0.375rem" }}></span>
                                {bot?.status}
                            </div>
                        </div>
                        <div className="mono" style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{t("bot_configuration")}</div>
                    </div>
                </div>
                <div className="bot-tabs">
                    {tabLinks.map(tab => {
                        const active = tab.exact ? location.pathname === tab.to : location.pathname.includes(tab.to.split('/').pop())
                        return (
                            <Link key={tab.to} to={tab.to}
                                className={`btn ${active ? "btn-secondary" : "btn-ghost"}`}
                                style={{ padding: "0.5rem 1rem", border: "none", whiteSpace: "nowrap", flexShrink: 0 }}
                            >
                                {tab.icon} {tab.label}
                            </Link>
                        )
                    })}
                </div>
            </div>

            <div className="grid-2col" style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: "1.5rem", alignItems: "start" }}>
                <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div className="card">
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem", color: "#fff" }}>
                            <Settings size={20} />
                            <h2 style={{ fontSize: "1.125rem" }}>{t("general_settings")}</h2>
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-muted)", marginBottom: "0.5rem" }}>{t("cmd_prefix")}</label>
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                                <input value={cfg.prefix} onChange={e => setCfg(c => ({ ...c, prefix: e.target.value }))} maxLength={3} style={{ width: "80px", textAlign: "center", fontSize: "1.25rem" }} className="mono" />
                                <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>{t("cmd_prefix_hint")}</span>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem", color: "#fff" }}>
                            <MessageSquare size={20} />
                            <h2 style={{ fontSize: "1.125rem" }}>{t("automated_messages")}</h2>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                            <div>
                                <label style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-muted)", marginBottom: "0.5rem", flexWrap: "wrap", gap: "0.25rem" }}>
                                    <span>{t("welcome_msg")}</span>
                                    <span className="mono" style={{ fontSize: "0.75rem", color: "var(--info)" }}>{t("variables_hint")}: {'{name}, {group}'}</span>
                                </label>
                                <textarea value={cfg.welcome_msg || ""} onChange={e => setCfg(c => ({ ...c, welcome_msg: e.target.value }))} rows={3} placeholder="Welcome, {name}!" style={{ width: "100%", resize: "vertical" }} />
                            </div>
                            <div>
                                <label style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-muted)", marginBottom: "0.5rem", flexWrap: "wrap", gap: "0.25rem" }}>
                                    <span>{t("goodbye_msg")}</span>
                                    <span className="mono" style={{ fontSize: "0.75rem", color: "var(--info)" }}>{t("variables_hint")}: {'{name}, {group}'}</span>
                                </label>
                                <textarea value={cfg.goodbye_msg || ""} onChange={e => setCfg(c => ({ ...c, goodbye_msg: e.target.value }))} rows={2} placeholder="Goodbye {name}." style={{ width: "100%", resize: "vertical" }} />
                            </div>
                            <hr style={{ border: "none", borderTop: "1px solid var(--border-subtle)", margin: "0.25rem 0" }} />
                            <div>
                                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-muted)", marginBottom: "0.5rem" }}>{t("auto_reply")}</label>
                                <textarea value={cfg.auto_reply || ""} onChange={e => setCfg(c => ({ ...c, auto_reply: e.target.value }))} rows={2} placeholder={t("auto_reply_placeholder")} style={{ width: "100%", resize: "vertical" }} />
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem", color: "#fff" }}>
                            <Shield size={20} />
                            <h2 style={{ fontSize: "1.125rem" }}>{t("security")}</h2>
                        </div>
                        <label style={{ display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer", background: "var(--bg-base)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                            <input type="checkbox" checked={!!cfg.anti_spam} onChange={e => setCfg(c => ({ ...c, anti_spam: e.target.checked }))} style={{ width: 18, height: 18, accentColor: "var(--accent)" }} />
                            <div>
                                <div style={{ fontWeight: 500, color: "#fff", marginBottom: "0.25rem" }}>{t("anti_spam")}</div>
                                <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>{t("anti_spam_desc")}</div>
                            </div>
                        </label>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button type="submit" disabled={saving} className={`btn ${saved ? "btn-secondary" : "btn-primary"}`} style={{ minWidth: 160, padding: "0.875rem", fontSize: "1rem", borderColor: saved ? "var(--accent)" : "transparent", color: saved ? "var(--accent)" : undefined }}>
                            {saving ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : saved ? t("saved_ok") : <><Save size={18} /> {t("save_config")}</>}
                        </button>
                    </div>
                </form>

                {/* Blacklist */}
                <div className="card" style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", color: "#fff" }}>
                        <Hash size={20} />
                        <h2 style={{ fontSize: "1.125rem" }}>{t("blacklist")}</h2>
                    </div>
                    <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>{t("blacklist_desc")}</p>
                    <form onSubmit={addBl} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
                        <input placeholder={t("number_placeholder")} value={newNumber} onChange={e => setNewNumber(e.target.value)} style={{ flex: 1, minWidth: 0 }} className="mono" />
                        <button type="submit" className="btn btn-secondary">{t("add")}</button>
                    </form>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {blacklist.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-muted)", fontSize: "0.875rem", border: "1px dashed var(--border-strong)", borderRadius: "8px" }}>
                                {t("no_blocked")}
                            </div>
                        ) : (
                            blacklist.map(item => (
                                <div key={item.number} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", background: "var(--bg-base)", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
                                    <span className="mono" style={{ color: "var(--text-main)", fontSize: "0.875rem" }}>{item.number}</span>
                                    <button onClick={() => removeBl(item.number)} className="btn-ghost" style={{ padding: "0.25rem", color: "var(--danger)" }}>
                                        <Hash size={14} />
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
