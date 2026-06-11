const QRCode = require('qrcode');

module.exports = async (sock, msg, from, args) => {
    const texte = args.join(' ');
    if (!texte) {
        return sock.sendMessage(from, { text: '❌ Utilisation : !qrcode <texte ou lien>' });
    }

    try {
        // Génère le QR code en buffer (image PNG)
        const qrBuffer = await QRCode.toBuffer(texte, { scale: 8 });
        await sock.sendMessage(from, {
            image: qrBuffer,
            caption: `📲 *QR Code* pour :\n${texte}`
        });
    } catch (err) {
        console.error(err);
        await sock.sendMessage(from, { text: '❌ Erreur lors de la génération du QR code.' });
    }
};

module.exports.description = '📲 Génère un QR code à partir d’un texte ou lien';
