import { Outlet, NavLink, useNavigate } from "react-router-dom"

export default function Layout({ user, setUser }) {
    const navigate = useNavigate()
    const logout = () => {
        localStorage.removeItem("token")
        setUser(null)
        navigate("/login")
    }
    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            <nav style={{ width: 220, background: "#0d1526", padding: "24px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ color: "#00c853", fontWeight: 700, fontSize: 20, padding: "0 12px 24px" }}>BotDash</div>
                <NavLink to="/dashboard" style={navStyle}>Dashboard</NavLink>
                <NavLink to="/bots" style={navStyle}>Mes Bots</NavLink>
                <div style={{ marginTop: "auto" }}>
                    <button onClick={logout} style={{ width: "100%", padding: "10px 12px", background: "transparent", color: "#888", border: "none", cursor: "pointer", textAlign: "left" }}>Déconnexion</button>
                </div>
            </nav>
            <main style={{ flex: 1, background: "#060d1f", padding: 32, overflow: "auto" }}>
                <Outlet />
            </main>
        </div>
    )
}
function navStyle({ isActive }) {
    return { display: "block", padding: "10px 12px", borderRadius: 8, color: isActive ? "#00c853" : "#888", textDecoration: "none", background: isActive ? "rgba(0,200,83,0.08)" : "transparent" }
}
