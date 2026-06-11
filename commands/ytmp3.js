const yts = require("yt-search")
const { exec } = require("child_process")
const fs = require("fs")

const sessions = {}

async function ytmp3Command(sock, msg, from, args) {
    const texte = msg.message.conversation ||
                  msg.message.extendedTextMessage?.text || ""

    // 🔥 Ignorer les messages du bot (évite la boucle)
    if (texte.startsWith("🎵") || texte.startsWith("🔍") || texte.startsWith("❌") || texte.startsWith("⬇️")) {
        return
    }

    // Étape 1 — !ytmp3 <titre>
    if (args && args.length > 0) {
        const titre = args.join(" ")
        sessions[from] = { etape: "recherche_en_cours" }

        await sock.sendMessage(from, {
            text: `🔍 Recherche de *${titre}* en cours...`
        }, { quoted: msg })

        try {
            const recherche = await yts(titre)
            const videos = recherche.videos.slice(0, 5)

            if (videos.length === 0) {
                await sock.sendMessage(from, { text: "❌ Aucun résultat trouvé !" })
                delete sessions[from]
                return
            }

            sessions[from] = { etape: "attente_choix", videos }

            let resultat = `🎵 *Résultats pour "${titre}" :*\n\n`
            videos.forEach((video, index) => {
                resultat += `*${index + 1}.* ${video.title}\n`
                resultat += `⏱️ ${video.timestamp}\n\n`
            })
            resultat += "Réponds avec *1, 2, 3, 4 ou 5* pour télécharger l'audio !"

            await sock.sendMessage(from, { text: resultat })
        } catch (e) {
            await sock.sendMessage(from, { text: "❌ Erreur de recherche !" })
            delete sessions[from]
        }
        return
    }

    // Pas de titre
    if (!sessions[from]) {
        sessions[from] = { etape: "attente_recherche" }
        await sock.sendMessage(from, {
            text: "🎵 *TITUSBOT - YouTube MP3*\n\nQuel titre tu veux télécharger ?\n\nOu tape directement *!ytmp3 <titre>*"
        }, { quoted: msg })
        return
    }

    // Étape 2 — Recherche si pas de titre
    if (sessions[from]?.etape === "attente_recherche") {
        sessions[from].etape = "recherche_en_cours"

        await sock.sendMessage(from, {
            text: "🔍 Recherche en cours..."
        }, { quoted: msg })

        try {
            const recherche = await yts(texte)
            const videos = recherche.videos.slice(0, 5)

            if (videos.length === 0) {
                await sock.sendMessage(from, { text: "❌ Aucun résultat trouvé !" })
                delete sessions[from]
                return
            }

            sessions[from] = { etape: "attente_choix", videos }

            let resultat = "🎵 *Résultats :*\n\n"
            videos.forEach((video, index) => {
                resultat += `*${index + 1}.* ${video.title}\n`
                resultat += `⏱️ ${video.timestamp}\n\n`
            })
            resultat += "Réponds avec *1, 2, 3, 4 ou 5* pour télécharger l'audio !"

            await sock.sendMessage(from, { text: resultat })
        } catch (e) {
            await sock.sendMessage(from, { text: "❌ Erreur de recherche !" })
            delete sessions[from]
        }
        return
    }

    // Étape 3 — Téléchargement audio
    if (sessions[from]?.etape === "attente_choix") {
        const choix = parseInt(texte.trim())

        if (isNaN(choix) || choix < 1 || choix > 5) {
            await sock.sendMessage(from, {
                text: "❌ Envoie un numéro entre 1 et 5 !"
            }, { quoted: msg })
            return
        }

        const video = sessions[from].videos[choix - 1]
        delete sessions[from]

        await sock.sendMessage(from, {
            text: `⬇️ Téléchargement audio de *${video.title}* en cours...`
        }, { quoted: msg })

        const chemin = `./audio_${Date.now()}.mp3`

        exec(`yt-dlp -x --audio-format mp3 --audio-quality 0 -o "${chemin}" "${video.url}"`, async (err) => {
            if (err) {
                await sock.sendMessage(from, {
                    text: "❌ Erreur lors du téléchargement !"
                })
                return
            }

            try {
                await sock.sendMessage(from, {
                    audio: fs.readFileSync(chemin),
                    mimetype: "audio/mpeg",
                    fileName: `${video.title}.mp3`
                }, { quoted: msg })
                fs.unlinkSync(chemin)
            } catch (e) {
                await sock.sendMessage(from, {
                    text: "❌ Erreur lors de l'envoi !"
                })
                if (fs.existsSync(chemin)) fs.unlinkSync(chemin)
            }
        })
    }
}

ytmp3Command.sessions = sessions
module.exports = ytmp3Command
module.exports.description = "🎵 Télécharge l'audio (MP3) d'une vidéo YouTube"
