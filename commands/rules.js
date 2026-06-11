const fs = require("fs")
const path = require("path")

function getRules() {
    const file = path.join(__dirname, "../rules.json")
    if (!fs.existsSync(file)) return {}
    try { return JSON.parse(fs.readFileSync(file, "utf-8")) } catch (e) { return {} }
}

module.exports = async (sock, msg, from, args) => {
    if (!from.endsWith("@g.us")) {
        return sock.sendMessage(from, { text: "❌ Cette commande n'est utilisable que dans un groupe." })
    }

    const rules = getRules()
    const groupRules = rules[from]

    if (!groupRules || groupRules.length === 0) {
        return sock.sendMessage(from, {
            text: "❌ Aucune règle définie pour ce groupe !\nUtilise *!setrules* pour définir les règles."
        }, { quoted: msg })
    }

    let texte = "📋 *RÈGLES DU GROUPE*\n\n"
    groupRules.forEach((rule, index) => {
        texte += `*${index + 1}.* ${rule}\n`
    })
    texte += "\n_Respectez les règles pour une bonne ambiance !_ 🙏"

    await sock.sendMessage(from, { text: texte }, { quoted: msg })
}

module.exports.description = "📋 Afficher les règles du groupe"
