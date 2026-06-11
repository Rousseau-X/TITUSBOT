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
        // Le bot lui-même
        senderNumber = sock.user.id.split(":")[0].split("@")[0];
    } else {
        const senderRaw = msg.key.participant || msg.key.remoteJid;
        senderNumber = senderRaw.split("@")[0].split(":")[0];
    }

    const ownerNumber = config.proprietaire;

    console.log("🔍 Expéditeur :", senderNumber, "| Proprio :", ownerNumber);

    if (senderNumber !== ownerNumber) {
        return sock.sendMessage(from, {
            text: "❌ Seul le propriétaire peut utiliser cette commande !"
        }, { quoted: msg });
    }

    const settings = getSettings();
    settings.autoview = !settings.autoview;
    saveSettings(settings);

    await sock.sendMessage(from, {
        text: settings.autoview
            ? "👁️ *Autoviewstatus activé !*\nJe vais voir tous les statuts automatiquement !"
            : "🔓 *Autoviewstatus désactivé !*"
    }, { quoted: msg });
};

module.exports.description = "👁️ Voir automatiquement tous les statuts";
