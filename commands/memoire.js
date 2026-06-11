module.exports = async (sock, msg, from) => {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const mem = process.memoryUsage().heapUsed / 1024 / 1024;
    const cmdCount = Object.keys(require('fs').readdirSync('./commands')).length;
    await sock.sendMessage(from, { text: `🤖 *TITUSBOT*\n📆 Uptime : ${days}j ${hours}h ${minutes}m\n💾 RAM : ${mem.toFixed(2)} MB\n📦 Commandes : ${cmdCount}` });
};
module.exports.description = '📊 Affiche les stats techniques du bot';
