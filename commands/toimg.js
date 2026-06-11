const { downloadContentFromMessage } = require("@whiskeysockets/baileys")

module.exports = async (sock, msg, from, args) => {
    const message = msg.message
    const stickerMessage = message?.stickerMessage ||
                           message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage

    if (!stickerMessage) {
        return sock.sendMessage(from, {
            text: "❌ Envoie un sticker ou réponds à un sticker avec *!toimg* !"
        }, { quoted: msg })
    }

    await sock.sendMessage(from, {
        text: "⏳ Conversion en cours..."
    }, { quoted: msg })

    try {
        // Télécharger le sticker
        const stream = await downloadContentFromMessage(stickerMessage, "sticker")
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }

        // Envoyer comme image
        await sock.sendMessage(from, {
            image: buffer,
            caption: "✅ Sticker converti en image ! 🖼️"
        }, { quoted: msg })

    } catch (err) {
        console.error("ERREUR TOIMG :", err.message)
        await sock.sendMessage(from, {
            text: `❌ Erreur : ${err.message}`
        })
    }
}

module.exports.description = "🖼️ Convertit un sticker en image"
