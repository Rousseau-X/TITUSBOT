module.exports = async (sock, msg, from, args) => {
    if (!from.endsWith("@g.us")) {
        return sock.sendMessage(from, { text: "❌ Cette commande n'est utilisable que dans un groupe." })
    }

    let groupMetadata
    try {
        groupMetadata = await sock.groupMetadata(from)
    } catch (err) {
        return sock.sendMessage(from, { text: "❌ Impossible de récupérer les infos du groupe." })
    }

    const admins = groupMetadata.participants
        .filter(p => p.admin === "admin" || p.admin === "superadmin")
        .map(p => `@${p.id.split("@")[0]}`)
        .join("\n")

    const totalMembers = groupMetadata.participants.length
    const totalAdmins = groupMetadata.participants.filter(p => p.admin).length

    const createdAt = groupMetadata.creation
        ? new Date(groupMetadata.creation * 1000).toLocaleDateString("fr-FR")
        : "Inconnue"

    const texte = `
📊 *INFOS DU GROUPE*

📌 *Nom :* ${groupMetadata.subject}
📅 *Créé le :* ${createdAt}
👥 *Membres :* ${totalMembers}
👑 *Admins :* ${totalAdmins}

👑 *Liste des admins :*
${admins}

📝 *Description :*
${groupMetadata.desc || "Aucune description"}
    `.trim()

    await sock.sendMessage(from, {
        text: texte,
        mentions: groupMetadata.participants
            .filter(p => p.admin)
            .map(p => p.id)
    }, { quoted: msg })
}

module.exports.description = "📊 Affiche les informations du groupe"
