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

    const mentions = groupMetadata.participants.map(p => p.id)
    const message = args && args.length > 0 ? args.join(" ") : "📢 Message important !"

    await sock.sendMessage(from, {
        text: message,
        mentions: mentions
    }, { quoted: msg })
}

module.exports.description = "👻 Taguer tout le monde discrètement"
