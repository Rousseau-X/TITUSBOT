const fs = require("fs");
const path = require("path");

function getSettings() {
    const file = path.join(__dirname, "../statusconfig.json");
    if (!fs.existsSync(file)) return {};
    try { return JSON.parse(fs.readFileSync(file, "utf-8")); } catch (e) { return {}; }
}

function saveSettings(data) {
    fs.writeFileSync(path.join(__dirname, "../statusconfig.json"), JSON.stringify(data, null, 2));
}

module.exports = async (sock, msg, from, args) => {
    const config = require("../config");

    // Récupération fiable de l'expéditeur (numéro uniquement)
    let senderNumber = null;
    if (msg.key.fromMe) {
        // Le bot lui‑même (si jamais)
        senderNumber = sock.user.id.split(":")[0].split("@")[0];
    } else {
        const senderRaw = msg.key.participant || msg.key.remoteJid;
        senderNumber = senderRaw.split("@")[0].split(":")[0];
    }

    const ownerNumber = config.proprietaire; // attendu : "2290129399467" (sans +)

    console.log("🔍 Expéditeur (numéro):", senderNumber);
    console.log("🔍 Propriétaire config:", ownerNumber);

    // Vérifier si l'expéditeur est le propriétaire
    if (senderNumber !== ownerNumber) {
        return sock.sendMessage(from, {
            text: "❌ Seul le propriétaire peut utiliser cette commande !"
        }, { quoted: msg });
    }

    const settings = getSettings();
    settings.autoreact = !settings.autoreact;
    if (!settings.reactEmoji) settings.reactEmoji = "🔥";
    saveSettings(settings);

    await sock.sendMessage(from, {
        text: settings.autoreact
            ? `🔥 *Autoreactstatus activé !*\nJe vais réagir aux statuts avec ${settings.reactEmoji} !`
            : "🔓 *Autoreactstatus désactivé !*"
    }, { quoted: msg });
};

module.exports.description = "🔥 Réagir automatiquement à tous les statuts";
