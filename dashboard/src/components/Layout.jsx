import { useState, useRef, useEffect } from "react"
import { Outlet, NavLink, useNavigate } from "react-router-dom"
import { LayoutDashboard, Bot, LogOut, Globe, X, Menu, ChevronDown } from "lucide-react"
import { useLang, LANGUAGES } from "../i18n/LangContext"

export default function Layout({ user, setUser }) {
    const navigate = useNavigate()
    const { t, lang, setLang } = useLang()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [langOpen, setLangOpen] = useState(false)
    const langRef = useRef(null)

    const logout = () => {
        localStorage.removeItem("token")
        setUser(null)
        navigate("/login")
    }

    useEffect(() => {
        const handle = (e) => { if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false) }
        document.addEventListener("mousedown", handle)
        return () => document.removeEventListener("mousedown", handle)
    }, [])

    const currentLang = LANGUAGES.find(l => l.code === lang)

    const navLinks = [
        { to: "/dashboard", icon: <LayoutDashboard size={20} />, label: t("dashboard") },
        { to: "/bots", icon: <Bot size={20} />, label: t("my_bots") },
    ]

    return (
        <div className="layout-root">
            {/* Desktop Sidebar */}
            <nav className="sidebar">
                <div className="sidebar-logo">BotDash</div>

                <div className="sidebar-nav">
                    {navLinks.map(link => (
                        <NavLink key={link.to} to={link.to} className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
                            {link.icon}
                            <span>{link.label}</span>
                        </NavLink>
                    ))}
                </div>

                <div className="sidebar-bottom">
                    <div className="lang-picker" ref={langRef}>
                        <button className="lang-trigger" onClick={() => setLangOpen(o => !o)}>
                            <Globe size={16} />
                            <span>{currentLang?.flag} {currentLang?.label}</span>
                            <ChevronDown size={14} style={{ marginLeft: "auto", opacity: 0.5 }} />
                        </button>
                        {langOpen && (
                            <div className="lang-dropdown">
                                {LANGUAGES.map(l => (
                                    <button
                                        key={l.code}
                                        className={`lang-option${lang === l.code ? " selected" : ""}`}
                                        onClick={() => { setLang(l.code); setLangOpen(false) }}
                                    >
                                        {l.flag} {l.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button className="sidebar-link logout-btn" onClick={logout}>
                        <LogOut size={20} />
                        <span>{t("logout")}</span>
                    </button>
                </div>
            </nav>

            {/* Mobile overlay sidebar */}
            {sidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}>
                    <nav className="sidebar-drawer" onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                            <div className="sidebar-logo" style={{ paddingBottom: 0 }}>BotDash</div>
                            <button onClick={() => setSidebarOpen(false)} className="sidebar-link" style={{ padding: "0.5rem" }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="sidebar-nav">
                            {navLinks.map(link => (
                                <NavLink key={link.to} to={link.to}
                                    className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    {link.icon}
                                    <span>{link.label}</span>
                                </NavLink>
                            ))}
                        </div>
                        <div className="sidebar-bottom" style={{ marginTop: "auto" }}>
                            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", padding: "0.25rem 0" }}>
                                {LANGUAGES.map(l => (
                                    <button
                                        key={l.code}
                                        onClick={() => { setLang(l.code); setSidebarOpen(false) }}
                                        style={{
                                            padding: "0.375rem 0.625rem", borderRadius: "6px", border: "1px solid",
                                            borderColor: lang === l.code ? "var(--accent)" : "var(--border-strong)",
                                            background: lang === l.code ? "var(--accent-dim)" : "transparent",
                                            color: lang === l.code ? "var(--accent)" : "var(--text-muted)",
                                            cursor: "pointer", fontSize: "0.8125rem", fontWeight: 500
                                        }}
                                    >
                                        {l.flag} {l.label}
                                    </button>
                                ))}
                            </div>
                            <button className="sidebar-link logout-btn" onClick={logout}>
                                <LogOut size={20} />
                                <span>{t("logout")}</span>
                            </button>
                        </div>
                    </nav>
                </div>
            )}

            {/* Mobile top bar */}
            <header className="mobile-header">
                <button className="sidebar-link" style={{ padding: "0.5rem" }} onClick={() => setSidebarOpen(true)}>
                    <Menu size={22} />
                </button>
                <span className="sidebar-logo" style={{ paddingBottom: 0, fontSize: "1.125rem" }}>BotDash</span>
                <div style={{ position: "relative" }} ref={langRef}>
                    <button className="sidebar-link" style={{ padding: "0.5rem" }} onClick={() => setLangOpen(o => !o)}>
                        <Globe size={20} />
                    </button>
                    {langOpen && (
                        <div className="lang-dropdown lang-dropdown-mobile">
                            {LANGUAGES.map(l => (
                                <button
                                    key={l.code}
                                    className={`lang-option${lang === l.code ? " selected" : ""}`}
                                    onClick={() => { setLang(l.code); setLangOpen(false) }}
                                >
                                    {l.flag} {l.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </header>

            {/* Main content */}
            <main className="layout-main">
                <Outlet />
            </main>

            {/* Mobile bottom nav */}
            <nav className="bottom-nav">
                {navLinks.map(link => (
                    <NavLink key={link.to} to={link.to} className={({ isActive }) => `bottom-nav-item${isActive ? " active" : ""}`}>
                        {link.icon}
                        <span>{link.label}</span>
                    </NavLink>
                ))}
                <button className="bottom-nav-item" onClick={logout}>
                    <LogOut size={20} />
                    <span>{t("logout")}</span>
                </button>
            </nav>
        </div>
    )
}
