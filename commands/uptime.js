module.exports = async (sock, msg, from, args) => {
    const uptime = process.uptime()
    const jours = Math.floor(uptime / 86400)
    const heures = Math.floor((uptime % 86400) / 3600)
    const minutes = Math.floor((uptime % 3600) / 60)
    const secondes = Math.floor(uptime % 60)

    let texte = "⏱️ *TITUSBOT - UPTIME*\n\n"

    if (jours > 0) texte += `📅 *Jours :* ${jours}\n`
    texte += `🕐 *Heures :* ${heures}\n`
    texte += `⏳ *Minutes :* ${minutes}\n`
    texte += `⚡ *Secondes :* ${secondes}\n\n`
    texte += "_TITUSBOT tourne sans interruption ! 🚀_"

    await sock.sendMessage(from, { text: texte }, { quoted: msg })
}

module.exports.description = "⏱️ Affiche le temps de fonctionnement du bot"
