const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const getFakeVcard = require("../lib/fakeVcard");

module.exports = async (sock, msg, from) => {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedImage = quoted?.imageMessage;
    const quotedVideo = quoted?.videoMessage;

    if (quotedImage && quotedImage.viewOnce) {
        await sock.sendMessage(from, { text: "⬇️ Téléchargement en cours..." });

        const stream = await downloadContentFromMessage(quotedImage, "image");
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

        await sock.sendMessage(from, {
            image: buffer,
            caption: quotedImage.caption || "🤖 Envoyé par TITUSBOT"
        }, { quoted: getFakeVcard() });

    } else if (quotedVideo && quotedVideo.viewOnce) {
        await sock.sendMessage(from, { text: "⬇️ Téléchargement en cours..." });

        const stream = await downloadContentFromMessage(quotedVideo, "video");
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

        await sock.sendMessage(from, {
            video: buffer,
            caption: quotedVideo.caption || "🤖 Envoyé par TITUSBOT"
        }, { quoted: getFakeVcard() });

    } else {
        await sock.sendMessage(from, {
            text: "❌ Réponds à un message viewonce pour utiliser cette commande !"
        });
    }
};

// Description pour le menu
module.exports.description = "👁️ Révèle un message 'view once' (image/vidéo)";