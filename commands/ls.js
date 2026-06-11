const fs = require('fs');
const path = require('path');

module.exports = async (sock, msg, from, args) => {
    const config = require('../config');
    const sender = msg.key.participant?.split('@')[0] || msg.key.remoteJid.split('@')[0];
    if (sender !== config.proprietaire) return sock.sendMessage(from, { text: '❌ Réservé au proprio.' });
    const dir = args[0] || '.';
    try {
        const files = fs.readdirSync(dir);
        const list = files.slice(0, 20).join('\n');
        await sock.sendMessage(from, { text: `📂 *${dir}* :\n${list}` });
    } catch (e) {
        await sock.sendMessage(from, { text: `❌ Erreur : ${e.message}` });
    }
};
module.exports.description = '📂 Liste les fichiers d’un dossier (proprio)';
