module.exports = async (sock, msg, from, args) => {
    // 1. Vérifier que c'est un groupe
    if (!from.endsWith("@g.us")) {
        return sock.sendMessage(from, { text: "❌ Cette commande n'est utilisable que dans un groupe." });
    }

    // Récupérer l'ID de l'expéditeur
    let senderId = msg.key.participant || msg.participant;
    if (!senderId) {
        return sock.sendMessage(from, { text: "❌ Impossible d'identifier l'expéditeur." });
    }

    // Récupérer les infos du groupe
    let groupMetadata;
    try {
        groupMetadata = await sock.groupMetadata(from);
    } catch (err) {
        return sock.sendMessage(from, { text: "❌ Impossible de récupérer les infos du groupe." });
    }

    // Vérifier que l'expéditeur est admin
    const sender = groupMetadata.participants.find(p => p.id === senderId);
    if (!sender || (sender.admin !== "admin" && sender.admin !== "superadmin")) {
        console.log(`Expéditeur: ${senderId}, Trouvé: ${!!sender}, Admin: ${sender?.admin}`);
        return sock.sendMessage(from, { text: "❌ Seuls les administrateurs du groupe peuvent utiliser cette commande." });
    }

    // Récupérer l'ID du bot correctement
    const rawBotId = sock.user.id;
    const botNumber = rawBotId.includes(":") ? rawBotId.split(":")[0] : rawBotId.split("@")[0];
    const botId = botNumber + "@s.whatsapp.net";

    // Récupérer le LID du bot — nettoyer le :14
    const botLid = sock.user?.lid || "";
    const botLidNumber = botLid.split("@")[0].split(":")[0];

    console.log("🤖 Bot Number :", botNumber);
    console.log("🤖 Bot LID nettoyé :", botLidNumber);

    // Vérifier que le bot est admin compatible @lid et @s.whatsapp.net
    const botParticipant = groupMetadata.participants.find(p => {
        const pNumber = p.id.split("@")[0].split(":")[0];
        return pNumber === botNumber ||
               p.id === botId ||
               (botLidNumber && pNumber === botLidNumber);
    });

    console.log("🤖 Bot dans le groupe :", botParticipant);

    if (!botParticipant || (botParticipant.admin !== "admin" && botParticipant.admin !== "superadmin")) {
        return sock.sendMessage(from, { text: "❌ Je ne suis pas administrateur dans ce groupe. Je ne peux pas exclure." });
    }

    // Trouver la cible
    let target = null;
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    const quoted = contextInfo?.quotedMessage;

    if (quoted && contextInfo?.participant) {
        target = contextInfo.participant;
    } else if (contextInfo?.mentionedJid?.length > 0) {
        target = contextInfo.mentionedJid[0];
    } else if (args && args[0]) {
        let num = args[0].replace(/[^0-9]/g, "");
        target = num + "@s.whatsapp.net";
    } else {
        return sock.sendMessage(from, { text: "❌ Utilisation :\n!kick (en répondant)\n!kick @mention\n!kick 229XXXXXXXX" });
    }

    // Sécurité
    if (target === botId) {
        return sock.sendMessage(from, { text: "❌ Je ne peux pas m'exclure moi-même." });
    }

    const isMember = groupMetadata.participants.some(p => p.id === target);
    if (!isMember) {
        return sock.sendMessage(from, { text: "❌ Cette personne n'est pas dans le groupe." });
    }

    // Exclure (remove)
    try {
        await sock.groupParticipantsUpdate(from, [target], "remove");
        await sock.sendMessage(from, {
            text: `✅ ${target.split("@")[0]} a été exclu(e) avec succès ! 👢`
        }, { quoted: msg });
    } catch (err) {
        console.error(err);
        await sock.sendMessage(from, { text: "❌ Erreur lors de l'exclusion." });
    }
};

module.exports.description = "👢 Expulse un membre (peut revenir par invitation)";
