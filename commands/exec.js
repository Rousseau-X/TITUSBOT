const { exec } = require('child_process');

module.exports = async (sock, msg, from, args) => {
    const config = require('../config');
    const sender = msg.key.participant?.split('@')[0] || msg.key.remoteJid.split('@')[0];
    if (sender !== config.proprietaire) return sock.sendMessage(from, { text: '❌ Commande réservée au propriétaire.' });

    const cmd = args.join(' ');
    if (!cmd) return sock.sendMessage(from, { text: '❌ !exec <commande>' });
    exec(cmd, (err, stdout, stderr) => {
        const output = err ? stderr || err.message : stdout;
        const truncated = output.length > 2000 ? output.substring(0, 1997) + '...' : output;
        sock.sendMessage(from, { text: `📟 *Résultat* :\n${truncated}` });
    });
};
module.exports.description = '⚠️ Exécute une commande shell (réservé proprio)';
