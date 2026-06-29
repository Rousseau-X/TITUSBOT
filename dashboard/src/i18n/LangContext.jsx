import { createContext, useContext, useState } from "react"
import translations from "./translations"

const LangContext = createContext(null)

export const LANGUAGES = [
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "es", label: "Español", flag: "🇪🇸" },
    { code: "pt", label: "Português", flag: "🇵🇹" },
]

export function LangProvider({ children }) {
    const [lang, setLangState] = useState(() => localStorage.getItem("lang") || "fr")

    const setLang = (code) => {
        localStorage.setItem("lang", code)
        setLangState(code)
    }

    const t = (key) => {
        return translations[lang]?.[key] ?? translations["en"]?.[key] ?? key
    }

    return (
        <LangContext.Provider value={{ lang, setLang, t, LANGUAGES }}>
            {children}
        </LangContext.Provider>
    )
}

export function useLang() {
    return useContext(LangContext)
}
