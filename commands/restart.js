module.exports = async (sock, msg, from) => {
    const config = require('../config');
    const sender = msg.key.participant?.split('@')[0] || msg.key.remoteJid.split('@')[0];
    if (sender !== config.proprietaire) return sock.sendMessage(from, { text: '❌ Réservé au proprio.' });
    await sock.sendMessage(from, { text: '🔄 Redémarrage en cours...' });
    process.exit(0); // PM2 ou système de supervision le relancera
};
module.exports.description = '🔄 Redémarre le bot (proprio)';
