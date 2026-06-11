const si = require('systeminformation');

module.exports = async (sock, msg, from) => {
    const [cpu, mem, disk] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.fsSize()
    ]);
    const text = `🖥️ *Serveur*\n🔹 CPU : ${cpu.currentLoad.toFixed(1)}%\n🔹 RAM : ${(mem.used / 1024 / 1024 / 1024).toFixed(1)}/${(mem.total / 1024 / 1024 / 1024).toFixed(1)} GB\n🔹 Disque : ${disk[0]?.used}/${disk[0]?.size} (${disk[0]?.use}%)`;
    await sock.sendMessage(from, { text });
};
module.exports.description = '📊 Statistiques du serveur (CPU, RAM, disque)';
