module.exports = async (sock, msg, from, args) => {
    // Vérifier que c'est un groupe
    if (!from.endsWith("@g.us")) {
        return sock.sendMessage(from, { text: "❌ Cette commande n'est utilisable que dans un groupe." })
    }

    // Récupérer l'ID de l'expéditeur
    let senderId = msg.key.participant || msg.participant
    if (!senderId) {
        return sock.sendMessage(from, { text: "❌ Impossible d'identifier l'expéditeur." })
    }

    // Récupérer les infos du groupe
    let groupMetadata
    try {
        groupMetadata = await sock.groupMetadata(from)
    } catch (err) {
        return sock.sendMessage(from, { text: "❌ Impossible de récupérer les infos du groupe." })
    }

    // Vérifier que l'expéditeur est admin
    const sender = groupMetadata.participants.find(p => p.id === senderId)
    if (!sender || (sender.admin !== "admin" && sender.admin !== "superadmin")) {
        return sock.sendMessage(from, { text: "❌ Seuls les administrateurs peuvent utiliser cette commande." })
    }

    // Vérifier que le bot est admin
    const botLidNumber = (sock.user?.lid || "").split("@")[0].split(":")[0]
    const botNumber = sock.user.id.includes(":") ? sock.user.id.split(":")[0] : sock.user.id.split("@")[0]

    const botParticipant = groupMetadata.participants.find(p => {
        const pNumber = p.id.split("@")[0].split(":")[0]
        return pNumber === botNumber || (botLidNumber && pNumber === botLidNumber)
    })

    if (!botParticipant || (botParticipant.admin !== "admin" && botParticipant.admin !== "superadmin")) {
        return sock.sendMessage(from, { text: "❌ Je ne suis pas administrateur dans ce groupe." })
    }

    // Trouver la cible
    let target = null
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo

    if (contextInfo?.participant) {
        target = contextInfo.participant
    } else if (contextInfo?.mentionedJid?.length > 0) {
        target = contextInfo.mentionedJid[0]
    } else if (args && args[0]) {
        let num = args[0].replace(/[^0-9]/g, "")
        target = num + "@s.whatsapp.net"
    } else {
        return sock.sendMessage(from, { text: "❌ Utilisation :\n!promote (en répondant)\n!promote @mention\n!promote 229XXXXXXXX" })
    }

    // Vérifier que la cible est dans le groupe
    const isMember = groupMetadata.participants.some(p => p.id === target)
    if (!isMember) {
        return sock.sendMessage(from, { text: "❌ Cette personne n'est pas dans le groupe." })
    }

    // Vérifier si déjà admin
    const targetParticipant = groupMetadata.participants.find(p => p.id === target)
    if (targetParticipant?.admin === "admin" || targetParticipant?.admin === "superadmin") {
        return sock.sendMessage(from, { text: "❌ Cette personne est déjà administrateur !" })
    }

    // Promouvoir
    try {
        await sock.groupParticipantsUpdate(from, [target], "promote")
        await sock.sendMessage(from, {
            text: `✅ ${target.split("@")[0]} a été promu administrateur ! 👑`
        }, { quoted: msg })
    } catch (err) {
        console.error(err)
        await sock.sendMessage(from, { text: "❌ Erreur lors de la promotion." })
    }
}

module.exports.description = "👑 Promeut un membre en administrateur"
