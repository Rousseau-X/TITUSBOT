module.exports = async (sock, msg, from, args) => {
    if (!from.endsWith("@g.us")) {
        return sock.sendMessage(from, { text: "❌ Cette commande n'est utilisable que dans un groupe." })
    }

    let senderId = msg.key.participant || msg.participant
    if (!senderId) {
        return sock.sendMessage(from, { text: "❌ Impossible d'identifier l'expéditeur." })
    }

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

    const botLidNumber = (sock.user?.lid || "").split("@")[0].split(":")[0]
    const botNumber = sock.user.id.includes(":") ? sock.user.id.split(":")[0] : sock.user.id.split("@")[0]

    const botParticipant = groupMetadata.participants.find(p => {
        const pNumber = p.id.split("@")[0].split(":")[0]
        return pNumber === botNumber || (botLidNumber && pNumber === botLidNumber)
    })

    if (!botParticipant || (botParticipant.admin !== "admin" && botParticipant.admin !== "superadmin")) {
        return sock.sendMessage(from, { text: "❌ Je ne suis pas administrateur dans ce groupe." })
    }

    try {
        await sock.groupSettingUpdate(from, "not_announcement")
        await sock.sendMessage(from, {
            text: "🔊 *Groupe ouvert !*\nTout le monde peut envoyer des messages."
        }, { quoted: msg })
    } catch (err) {
        console.error(err)
        await sock.sendMessage(from, { text: "❌ Erreur lors de l'ouverture du groupe." })
    }
}

module.exports.description = "🔊 Ouvre le groupe — tout le monde peut écrire"
