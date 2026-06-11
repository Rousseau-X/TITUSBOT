module.exports = async (sock, msg, from, args) => {
    const config = require('../config');
    const sender = msg.key.participant?.split('@')[0] || msg.key.remoteJid.split('@')[0];
    if (sender !== config.proprietaire) return sock.sendMessage(from, { text: '❌ Réservé au proprio.' });
    const code = args.join(' ');
    if (!code) return sock.sendMessage(from, { text: '❌ !eval <code>' });
    try {
        let result = eval(code);
        if (typeof result !== 'string') result = JSON.stringify(result, null, 2);
        if (result.length > 2000) result = result.substring(0, 1997) + '...';
        await sock.sendMessage(from, { text: `📜 *Résultat* :\n${result}` });
    } catch (e) {
        await sock.sendMessage(from, { text: `❌ Erreur : ${e.message}` });
    }
};
module.exports.description = '⚠️ Exécute du code JS (réservé proprio)';
