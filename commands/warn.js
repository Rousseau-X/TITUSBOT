const fs = require("fs")
const path = require("path")

const MAX_WARNS = 3

function getWarns() {
    const file = path.join(__dirname, "../warns.json")
    if (!fs.existsSync(file)) return {}
    try { return JSON.parse(fs.readFileSync(file, "utf-8")) } catch (e) { return {} }
}

function saveWarns(data) {
    fs.writeFileSync(path.join(__dirname, "../warns.json"), JSON.stringify(data, null, 2))
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

    let target = null
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo
    if (contextInfo?.participant) {
        target = contextInfo.participant
    } else if (contextInfo?.mentionedJid?.length > 0) {
        target = contextInfo.mentionedJid[0]
    } else if (args && args[0]) {
        target = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net"
    } else {
        return sock.sendMessage(from, { text: "❌ Utilisation : !warn (en répondant) / !warn @mention" })
    }

    const warns = getWarns()
    const key = `${from}_${target}`
    warns[key] = (warns[key] || 0) + 1
    saveWarns(warns)

    if (warns[key] >= MAX_WARNS) {
        try {
            await sock.groupParticipantsUpdate(from, [target], "remove")
            delete warns[key]
            saveWarns(warns)
            await sock.sendMessage(from, {
                text: `🚫 *${target.split("@")[0]}* a atteint *${MAX_WARNS} avertissements* et a été expulsé !`
            }, { quoted: msg })
        } catch (err) {
            await sock.sendMessage(from, { text: "❌ Erreur lors de l'expulsion." })
        }
    } else {
        await sock.sendMessage(from, {
            text: `⚠️ *${target.split("@")[0]}* a reçu un avertissement !\n📊 Avertissements : *${warns[key]}/${MAX_WARNS}*\n\n_${MAX_WARNS - warns[key]} avertissement(s) restant(s) avant expulsion !_`
        }, { quoted: msg })
    }
}

module.exports.description = "⚠️ Avertir un membre du groupe"
