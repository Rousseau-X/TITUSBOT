import { Routes, Route, Navigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { auth as authApi } from "./api/client"
import { LangProvider } from "./i18n/LangContext"

import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import DashboardPage from "./pages/DashboardPage"
import BotsPage from "./pages/BotsPage"
import BotDetailPage from "./pages/BotDetailPage"
import CommandsPage from "./pages/CommandsPage"
import ConfigPage from "./pages/ConfigPage"
import Layout from "./components/Layout"

function PrivateRoute({ children }) {
    const token = localStorage.getItem("token")
    return token ? children : <Navigate to="/login" replace />
}

export default function App() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) { setLoading(false); return }
        authApi.me().then(u => { setUser(u); setLoading(false) }).catch(() => {
            localStorage.removeItem("token")
            setLoading(false)
        })
    }, [])

    if (loading) return <div className="app-loading"><div className="spinner" /></div>

    return (
        <LangProvider>
            <Routes>
                <Route path="/login" element={<LoginPage setUser={setUser} />} />
                <Route path="/register" element={<RegisterPage setUser={setUser} />} />
                <Route path="/" element={<PrivateRoute><Layout user={user} setUser={setUser} /></PrivateRoute>}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="bots" element={<BotsPage />} />
                    <Route path="bots/:id" element={<BotDetailPage />} />
                    <Route path="bots/:id/commands" element={<CommandsPage />} />
                    <Route path="bots/:id/config" element={<ConfigPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </LangProvider>
    )
}
