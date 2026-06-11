const fs = require("fs");
const path = require("path");
const settingsFile = path.join(__dirname, "../group_settings.json");

let settings = {};
if (fs.existsSync(settingsFile)) {
    settings = JSON.parse(fs.readFileSync(settingsFile, "utf-8"));
}

function saveSettings() {
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
}

module.exports = async (sock, msg, from, args) => {
    if (!from.endsWith("@g.us")) {
        return sock.sendMessage(from, { text: "❌ Cette commande n'est utilisable que dans un groupe." });
    }
    const action = args[0]?.toLowerCase();
    if (action !== "on" && action !== "off") {
        return sock.sendMessage(from, { text: "❌ Utilisation : !setwelcome on/off" });
    }
    if (!settings[from]) settings[from] = { welcome: true, goodbye: true };
    settings[from].welcome = (action === "on");
    saveSettings();
    const status = action === "on" ? "activé ✅" : "désactivé ❌";
    await sock.sendMessage(from, { text: `🔔 Message de bienvenue ${status} pour ce groupe.` });
};
module.exports.description = "🔔 Active/désactive le message de bienvenue dans le groupe";
