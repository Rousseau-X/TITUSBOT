const { downloadContentFromMessage } = require("@whiskeysockets/baileys")
const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

module.exports = async (sock, msg, from, args) => {
    const message = msg.message
    const imageMessage = message?.imageMessage ||
                         message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage

    if (!imageMessage) {
        return sock.sendMessage(from, {
            text: "❌ Envoie une image ou réponds à une image avec *!sticker* !"
        }, { quoted: msg })
    }

    await sock.sendMessage(from, {
        text: "⏳ Création du sticker en cours..."
    }, { quoted: msg })

    const tmpInput = `./tmp_${Date.now()}.jpg`
    const tmpOutput = `./tmp_${Date.now()}.webp`

    try {
        // Télécharger l'image
        const stream = await downloadContentFromMessage(imageMessage, "image")
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }

        // Sauvegarder l'image temporairement
        fs.writeFileSync(tmpInput, buffer)

        // Convertir en WebP avec ffmpeg
        execSync(`ffmpeg -i ${tmpInput} -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000" -y ${tmpOutput}`)

        // Lire le WebP
        const webpBuffer = fs.readFileSync(tmpOutput)

        // Envoyer le sticker
        await sock.sendMessage(from, {
            sticker: webpBuffer
        }, { quoted: msg })

        // Nettoyer les fichiers temporaires
        fs.unlinkSync(tmpInput)
        fs.unlinkSync(tmpOutput)

    } catch (err) {
        console.error("ERREUR STICKER :", err.message)
        await sock.sendMessage(from, {
            text: `❌ Erreur : ${err.message}`
        })
        if (fs.existsSync(tmpInput)) fs.unlinkSync(tmpInput)
        if (fs.existsSync(tmpOutput)) fs.unlinkSync(tmpOutput)
    }
}

module.exports.description = "🎭 Convertit une image en sticker"
