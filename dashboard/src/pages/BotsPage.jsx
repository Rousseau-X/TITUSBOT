import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Bot, Plus, Trash2, ArrowRight, Phone, CheckCircle2, XCircle } from "lucide-react"
import { bots as botsApi } from "../api/client"
import { useLang } from "../i18n/LangContext"

export default function BotsPage() {
    const [botList, setBotList] = useState([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [name, setName] = useState("")
    const [creating, setCreating] = useState(false)
    const navigate = useNavigate()
    const { t } = useLang()

    const load = () => botsApi.list().then(setBotList).finally(() => setLoading(false))
    useEffect(() => { load() }, [])

    const createBot = async (e) => {
        e.preventDefault()
        setCreating(true)
        try {
            const newBot = await botsApi.create({ name })
            navigate(`/bots/${newBot.id}`)
        } catch {
            setCreating(false)
        }
    }

    const deleteBot = async (e, id) => {
        e.preventDefault()
        e.stopPropagation()
        if (!confirm(t("delete_bot_confirm"))) return
        await botsApi.remove(id)
        setBotList(bl => bl.filter(b => b.id !== id))
    }

    if (loading) return (
        <div className="app-loading"><div className="spinner" /></div>
    )

    return (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div className="page-header">
                <div className="page-header-title">
                    <h1 style={{ fontSize: "1.875rem", marginBottom: "0.25rem" }}>{t("my_bots_title")}</h1>
                    <p style={{ color: "var(--text-muted)" }}>{t("my_bots_subtitle")}</p>
                </div>
                {!showCreate && (
                    <button onClick={() => setShowCreate(true)} className="btn btn-primary">
                        <Plus size={18} />{t("new_bot")}
                    </button>
                )}
            </div>

            {showCreate && (
                <div className="card animate-fade-in">
                    <form onSubmit={createBot} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-muted)", marginBottom: "0.5rem" }}>{t("bot_name")}</label>
                            <input autoFocus placeholder={t("bot_name_placeholder")} value={name} onChange={e => setName(e.target.value)} required style={{ width: "100%" }} />
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                            <button type="button" onClick={() => setShowCreate(false)} className="btn btn-secondary">{t("cancel")}</button>
                            <button type="submit" disabled={creating} className="btn btn-primary" style={{ minWidth: 90 }}>
                                {creating ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : t("create")}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {botList.length === 0 && !showCreate ? (
                <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4rem 2rem", textAlign: "center", gap: "1rem" }}>
                    <div style={{ width: 64, height: 64, background: "var(--bg-surface-hover)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                        <Bot size={32} />
                    </div>
                    <div>
                        <div style={{ fontSize: "1.25rem", fontWeight: 600, color: "#fff", marginBottom: "0.5rem" }}>{t("no_bots_yet")}</div>
                        <div style={{ color: "var(--text-muted)" }}>{t("no_bots_yet_subtitle")}</div>
                    </div>
                    <button onClick={() => setShowCreate(true)} className="btn btn-primary" style={{ marginTop: "1rem" }}>
                        <Plus size={18} /> {t("create_bot")}
                    </button>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
                    {botList.map(bot => (
                        <Link key={bot.id} to={`/bots/${bot.id}`} style={{ display: "block" }}>
                            <div className="card" style={{ transition: "all 0.2s", display: "flex", flexDirection: "column", height: "100%" }}>
                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                                    <div style={{ display: "flex", gap: "1rem" }}>
                                        <div style={{ width: 44, height: 44, background: "var(--bg-base)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", border: "1px solid var(--border-subtle)", flexShrink: 0 }}>
                                            <Bot size={24} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "1.125rem", fontWeight: 600, color: "#fff", lineHeight: 1.2, marginBottom: "0.375rem" }}>{bot.name}</div>
                                            <div className={`badge badge-${bot.status}`}>
                                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", marginRight: "0.375rem" }}></span>
                                                {bot.status}
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={(e) => deleteBot(e, bot.id)} className="btn-ghost" style={{ padding: "0.375rem", borderRadius: "6px", color: "var(--text-muted)" }} title="Delete Bot">
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem", flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                                        <Phone size={16} />
                                        <span className="mono">{bot.phone || t("not_configured")}</span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                                        {bot.status === "connected" ? <CheckCircle2 size={16} color="var(--accent)" /> : <XCircle size={16} />}
                                        <span>{bot.status === "connected" ? t("session_active") : t("requires_pairing")}</span>
                                    </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "1rem", borderTop: "1px solid var(--border-subtle)" }}>
                                    <span className="mono" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>ID: {bot.id}</span>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-main)" }}>
                                        {t("manage")} <ArrowRight size={16} />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
