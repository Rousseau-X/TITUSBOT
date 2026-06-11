module.exports = async (sock, msg, from, args) => {
    const uptime = process.uptime()
    const heures = Math.floor(uptime / 3600)
    const minutes = Math.floor((uptime % 3600) / 60)
    const secondes = Math.floor(uptime % 60)

    const texte = `
🤖 *TITUSBOT - INFOS*

📌 *Nom :* TITUSBOT
👨‍💻 *Créateur :* FIANTO ROUSSEAU TITUS
📱 *Numéro :* +229 01 29 39 94 67
🌐 *Plateforme :* WhatsApp
⚙️ *Technologie :* Baileys + Node.js
⏱️ *Uptime :* ${heures}h ${minutes}m ${secondes}s

_Propulsé par TITUSBOT_ 🚀
    `.trim()

    await sock.sendMessage(from, {
        text: texte
    }, { quoted: msg })
}

module.exports.description = "ℹ️ Affiche les informations du bot"
