module.exports = async (sock, msg, from, args) => {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    let person1 = null, person2 = null;

    if (mentioned.length >= 2) {
        person1 = mentioned[0];
        person2 = mentioned[1];
    } else if (mentioned.length === 1) {
        person1 = msg.key.participant || msg.key.remoteJid;
        person2 = mentioned[0];
    } else if (args[0] && args[1]) {
        person1 = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        person2 = args[1].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    } else {
        return sock.sendMessage(from, { text: '❌ Mentionne deux personnes : !love @user1 @user2' });
    }

    // Pourcentage basé sur les noms + aléa
    const hash = (person1 + person2).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    let percent = (hash % 101);
    percent = (percent + Math.floor(Math.random() * 20)) % 101;

    // Barre de coeurs
    const hearts = '❤️'.repeat(Math.floor(percent / 10));
    const empties = '🖤'.repeat(10 - Math.floor(percent / 10));
    const bar = hearts + empties;

    let emoji, comment;
    if (percent < 20) { emoji = '💔'; comment = 'Pas de chance, c’est mort.'; }
    else if (percent < 40) { emoji = '💛'; comment = 'Un petit flirt, à voir...'; }
    else if (percent < 60) { emoji = '💚'; comment = 'Ça pourrait être sympa.'; }
    else if (percent < 80) { emoji = '💙'; comment = 'Bonne compatibilité !'; }
    else if (percent < 95) { emoji = '❤️'; comment = 'C’est le grand amour ❤️'; }
    else { emoji = '🔥'; comment = 'Âmes sœurs, c’est évident !'; }

    const name1 = person1.split('@')[0];
    const name2 = person2.split('@')[0];

    const text = `💘 *${name1}* ❤️ *${name2}*\n\n📊 *${percent}%* ${emoji}\n\n${bar}\n\n💬 ${comment}`;

    await sock.sendMessage(from, {
        text: text,
        mentions: [person1, person2]
    });
};

module.exports.description = '💘 Calcule l’amour entre deux personnes (texte avec barre)';
