const fs = require("fs")
const path = require("path")

function getSettings() {
    const file = path.join(__dirname, "../antidelete.json")
    if (!fs.existsSync(file)) return {}
    try { return JSON.parse(fs.readFileSync(file, "utf-8")) } catch (e) { return {} }
}

function saveSettings(data) {
    fs.writeFileSync(path.join(__dirname, "../antidelete.json"), JSON.stringify(data, null, 2))
}

module.exports = async (sock, msg, from, args) => {
    if (!from.endsWith("@g.us")) {
        return sock.sendMessage(from, { text: "❌ Cette commande n'est utilisable que dans un groupe." })
    }

    let senderId = msg.key.participant || msg.participant
    let groupMetadata
    try {
        groupMetadata = await sock.groupMetadata(from)
    } catch (err) {
        return sock.sendMessage(from, { text: "❌ Impossible de récupérer les infos du groupe." })
    }

    const sender = groupMetadata.participants.find(p => p.id === senderId)
    if (!sender || (sender.admin !== "admin" && sender.admin !== "superadmin")) {
        return sock.sendMessage(from, { text: "❌ Seuls les administrateurs peuvent utiliser cette commande." })
    }

    const settings = getSettings()
    const current = settings[from]?.enabled || false

    settings[from] = {
        enabled: !current,
        admins: groupMetadata.participants
            .filter(p => p.admin === "admin" || p.admin === "superadmin")
            .map(p => p.id)
    }
    saveSettings(settings)

    await sock.sendMessage(from, {
        text: settings[from].enabled
            ? "🛡️ *Antidelete activé !*\nLes messages supprimés seront envoyés aux admins !"
            : "🔓 *Antidelete désactivé !*"
    }, { quoted: msg })
}

module.exports.description = "🛡️ Activer/désactiver l'antidelete du groupe"
