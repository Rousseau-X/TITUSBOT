const yts = require("yt-search");
const { exec } = require("child_process");
const fs = require("fs");

const sessions = {};

async function ytbCommand(sock, msg, from, args) {
    const texte = msg.message.conversation ||
                  msg.message.extendedTextMessage?.text || "";

    // ⚠️ IGNORER LES MESSAGES ENVOYÉS PAR LE BOT (évite la boucle)
    if (texte.startsWith("🎵") || texte.startsWith("🔍") || texte.startsWith("❌") || texte.startsWith("⬇️")) {
        return;
    }

    // Étape 1 — !ytb <titre>
    if (args && args.length > 0) {
        const titre = args.join(" ");
        sessions[from] = { etape: "recherche_en_cours" };

        await sock.sendMessage(from, { text: `🔍 Recherche de *${titre}* en cours...` }, { quoted: msg });

        try {
            const recherche = await yts(titre);
            const videos = recherche.videos.slice(0, 5);

            if (videos.length === 0) {
                await sock.sendMessage(from, { text: "❌ Aucun résultat trouvé !" }, { quoted: msg });
                delete sessions[from];
                return;
            }

            sessions[from] = { etape: "attente_choix", videos };

            let resultat = `🎵 *Résultats pour "${titre}" :*\n\n`;
            videos.forEach((video, index) => {
                resultat += `*${index + 1}.* ${video.title}\n⏱️ ${video.timestamp}\n\n`;
            });
            resultat += "Réponds avec *1, 2, 3, 4 ou 5* pour télécharger !";

            await sock.sendMessage(from, { text: resultat });
        } catch (e) {
            await sock.sendMessage(from, { text: "❌ Erreur de recherche !" });
            delete sessions[from];
        }
        return;
    }

    // Pas de titre — demander
    if (!sessions[from]) {
        sessions[from] = { etape: "attente_recherche" };
        await sock.sendMessage(from, { text: "🎵 *TITUSBOT - YouTube*\n\nQuel titre tu veux rechercher ?\n\nOu tape directement *!ytb <titre>*" }, { quoted: msg });
        return;
    }

    // Étape 2 — Recherche si pas de titre dans la commande
    if (sessions[from]?.etape === "attente_recherche") {
        sessions[from].etape = "recherche_en_cours";
        await sock.sendMessage(from, { text: "🔍 Recherche en cours..." }, { quoted: msg });

        try {
            const recherche = await yts(texte);
            const videos = recherche.videos.slice(0, 5);

            if (videos.length === 0) {
                await sock.sendMessage(from, { text: "❌ Aucun résultat trouvé !" });
                delete sessions[from];
                return;
            }

            sessions[from] = { etape: "attente_choix", videos };

            let resultat = "🎵 *Résultats :*\n\n";
            videos.forEach((video, index) => {
                resultat += `*${index + 1}.* ${video.title}\n⏱️ ${video.timestamp}\n\n`;
            });
            resultat += "Réponds avec *1, 2, 3, 4 ou 5* pour télécharger !";

            await sock.sendMessage(from, { text: resultat });
        } catch (e) {
            await sock.sendMessage(from, { text: "❌ Erreur de recherche !" });
            delete sessions[from];
        }
        return;
    }

    // Étape 3 — Téléchargement
    if (sessions[from]?.etape === "attente_choix") {
        const choix = parseInt(texte.trim());
        if (isNaN(choix) || choix < 1 || choix > sessions[from].videos.length) {
            await sock.sendMessage(from, { text: `❌ Envoie un numéro entre 1 et ${sessions[from].videos.length} !` }, { quoted: msg });
            return;
        }

        const video = sessions[from].videos[choix - 1];
        delete sessions[from];

        await sock.sendMessage(from, { text: `⬇️ Téléchargement de *${video.title}* en cours...` }, { quoted: msg });

        const chemin = `./video_${Date.now()}.mp4`;

        exec(`yt-dlp -f "best[height<=720][ext=mp4]" -o "${chemin}" "${video.url}"`, async (err) => {
            if (err) {
                await sock.sendMessage(from, { text: "❌ Erreur lors du téléchargement." });
                return;
            }

            try {
                const stats = fs.statSync(chemin);
                const fileSizeMB = stats.size / (1024 * 1024);
                if (fileSizeMB > 60) {
                    await sock.sendMessage(from, { text: "⚠️ Vidéo trop lourde (>60 Mo), envoi impossible." });
                    fs.unlinkSync(chemin);
                    return;
                }

                await sock.sendMessage(from, {
                    video: fs.readFileSync(chemin),
                    caption: `🎵 *${video.title}*\n🤖 TITUSBOT`
                });
                fs.unlinkSync(chemin);
            } catch (e) {
                await sock.sendMessage(from, { text: "❌ Erreur lors de l'envoi." });
                if (fs.existsSync(chemin)) fs.unlinkSync(chemin);
            }
        });
    }
}

module.exports = ytbCommand;
module.exports.sessions = sessions;
module.exports.description = "🎵 Recherche et télécharge une vidéo YouTube";