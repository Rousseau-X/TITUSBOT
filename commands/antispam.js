const fs = require("fs")
const path = require("path")

const spamTracker = {}

function getSettings() {
    const file = path.join(__dirname, "../antispam.json")
    if (!fs.existsSync(file)) return {}
    try { return JSON.parse(fs.readFileSync(file, "utf-8")) } catch (e) { return {} }
}

function saveSettings(data) {
    fs.writeFileSync(path.join(__dirname, "../antispam.json"), JSON.stringify(data, null, 2))
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
    const current = settings[from] || false

    settings[from] = !current
    saveSettings(settings)

    await sock.sendMessage(from, {
        text: settings[from]
            ? "🛡️ *Anti-spam activé !*\nLes membres qui envoient trop de messages seront expulsés !"
            : "🔓 *Anti-spam désactivé !*"
    }, { quoted: msg })
}

module.exports.checkSpam = async (sock, msg, from) => {
    const settings = getSettings()
    if (!settings[from]) return

    const senderId = msg.key.participant || msg.participant
    if (!senderId) return

    const key = `${from}_${senderId}`
    const now = Date.now()

    if (!spamTracker[key]) {
        spamTracker[key] = { count: 1, time: now }
        return
    }

    const diff = now - spamTracker[key].time

    if (diff < 5000) {
        spamTracker[key].count++
        if (spamTracker[key].count >= 5) {
            delete spamTracker[key]
            try {
                await sock.groupParticipantsUpdate(from, [senderId], "remove")
                await sock.sendMessage(from, {
                    text: `🚫 *${senderId.split("@")[0]}* a été expulsé pour spam !`
                })
            } catch (e) {}
        }
    } else {
        spamTracker[key] = { count: 1, time: now }
    }
}

module.exports.description = "🛡️ Activer/désactiver l'anti-spam du groupe"
