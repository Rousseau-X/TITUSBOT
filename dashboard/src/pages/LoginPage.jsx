import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Cpu, Mail, Lock, AlertCircle } from "lucide-react"
import { auth as authApi } from "../api/client"
import { useLang } from "../i18n/LangContext"

export default function LoginPage({ setUser }) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const { t, lang, setLang, LANGUAGES } = useLang()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError("")
        try {
            const res = await authApi.login({ email, password })
            localStorage.setItem("token", res.token)
            setUser(res.user)
            navigate("/dashboard")
        } catch (err) {
            setError(err.error || t("invalid_credentials"))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)", padding: "1.5rem" }}>
            <div className="card animate-fade-in" style={{ width: "100%", maxWidth: 400, padding: "2.5rem 2rem" }}>
                {/* Language selector */}
                <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                    {LANGUAGES.map(l => (
                        <button key={l.code} onClick={() => setLang(l.code)} style={{
                            padding: "0.25rem 0.625rem", borderRadius: "6px", border: "1px solid",
                            borderColor: lang === l.code ? "var(--accent)" : "var(--border-strong)",
                            background: lang === l.code ? "var(--accent-dim)" : "transparent",
                            color: lang === l.code ? "var(--accent)" : "var(--text-muted)",
                            cursor: "pointer", fontSize: "0.75rem", fontWeight: 500
                        }}>{l.flag} {l.label}</button>
                    ))}
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "2rem" }}>
                    <div style={{ width: 48, height: 48, background: "var(--accent-dim)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", marginBottom: "1rem", border: "1px solid var(--accent-muted)" }}>
                        <Cpu size={28} strokeWidth={2} />
                    </div>
                    <h1 style={{ fontSize: "1.5rem", marginBottom: "0.25rem", color: "#fff" }}>{t("welcome_back")}</h1>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{t("sign_in_subtitle")}</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {error && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem", background: "var(--danger-dim)", color: "var(--danger)", borderRadius: "6px", fontSize: "0.875rem", border: "1px solid rgba(255, 77, 77, 0.2)" }}>
                            <AlertCircle size={16} />{error}
                        </div>
                    )}
                    <div>
                        <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-muted)", marginBottom: "0.5rem" }}>{t("email")}</label>
                        <div style={{ position: "relative" }}>
                            <Mail size={16} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                            <input type="email" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: "100%", paddingLeft: "2.5rem" }} />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-muted)", marginBottom: "0.5rem" }}>{t("password")}</label>
                        <div style={{ position: "relative" }}>
                            <Lock size={16} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: "100%", paddingLeft: "2.5rem" }} />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: "0.5rem", padding: "0.75rem" }}>
                        {loading ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : t("sign_in")}
                    </button>
                </form>

                <div style={{ marginTop: "2rem", textAlign: "center", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                    {t("no_account")} <Link to="/register" style={{ fontWeight: 500 }}>{t("create_account")}</Link>
                </div>
            </div>
        </div>
    )
}
