const { exec } = require("child_process")
const fs = require("fs")

module.exports = async (sock, msg, from, args) => {
    if (!args || args.length === 0) {
        return sock.sendMessage(from, {
            text: "❌ Utilisation : *!tts <texte>*\nExemple : !tts Bonjour tout le monde"
        }, { quoted: msg })
    }

    const texte = args.join(" ")

    await sock.sendMessage(from, {
        text: "🎙️ Conversion en cours..."
    }, { quoted: msg })

    const chemin = `./tts_${Date.now()}.mp3`

    exec(`gtts-cli "${texte}" --lang fr --output ${chemin}`, async (err) => {
        if (err) {
            console.error("ERREUR TTS :", err.message)
            return sock.sendMessage(from, {
                text: "❌ Erreur lors de la conversion !"
            })
        }

        try {
            await sock.sendMessage(from, {
                audio: fs.readFileSync(chemin),
                mimetype: "audio/mpeg",
                fileName: "tts.mp3"
            }, { quoted: msg })
            fs.unlinkSync(chemin)
        } catch (e) {
            console.error("ERREUR ENVOI TTS :", e.message)
            await sock.sendMessage(from, {
                text: "❌ Erreur lors de l'envoi !"
            })
            if (fs.existsSync(chemin)) fs.unlinkSync(chemin)
        }
    })
}

module.exports.description = "🎙️ Convertit un texte en message vocal"
