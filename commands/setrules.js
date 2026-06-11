const fs = require("fs")
const path = require("path")

function getRules() {
    const file = path.join(__dirname, "../rules.json")
    if (!fs.existsSync(file)) return {}
    try { return JSON.parse(fs.readFileSync(file, "utf-8")) } catch (e) { return {} }
}

function saveRules(data) {
    fs.writeFileSync(path.join(__dirname, "../rules.json"), JSON.stringify(data, null, 2))
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

    if (!args || args.length === 0) {
        return sock.sendMessage(from, {
            text: "❌ Utilisation : *!setrules règle1 | règle2 | règle3*\nExemple : !setrules Pas de spam | Respectez tout le monde | Pas de pub"
        }, { quoted: msg })
    }

    const texteComplet = args.join(" ")
    const nouvellesRegles = texteComplet.split("|").map(r => r.trim()).filter(r => r.length > 0)

    const rules = getRules()
    rules[from] = nouvellesRegles
    saveRules(rules)

    let texte = `✅ *Règles du groupe mises à jour !*\n\n📋 *RÈGLES :*\n\n`
    nouvellesRegles.forEach((rule, index) => {
        texte += `*${index + 1}.* ${rule}\n`
    })

    await sock.sendMessage(from, { text: texte }, { quoted: msg })
}

module.exports.description = "✏️ Définir les règles du groupe"
