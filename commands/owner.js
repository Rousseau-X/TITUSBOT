module.exports = async (sock, msg, from, args) => {
    const texte = `
👨‍💻 *PROPRIÉTAIRE DE TITUSBOT*

👤 *Nom :* FIANTO ROUSSEAU TITUS
📱 *Numéro :* +229 01 29 39 94 67
🤖 *Bot :* TITUSBOT

_Pour toute question ou problème contacte le propriétaire !_ 💬
    `.trim()

    await sock.sendMessage(from, {
        text: texte
    }, { quoted: msg })
}

module.exports.description = "👨‍💻 Affiche les infos du propriétaire"
