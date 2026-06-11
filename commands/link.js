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

    try {
        const code = await sock.groupInviteCode(from)
        await sock.sendMessage(from, {
            text: `🔗 *Lien d'invitation du groupe :*\nhttps://chat.whatsapp.com/${code}`
        }, { quoted: msg })
    } catch (err) {
        await sock.sendMessage(from, { text: "❌ Erreur lors de la récupération du lien." })
    }
}

module.exports.description = "🔗 Obtenir le lien d'invitation du groupe"
