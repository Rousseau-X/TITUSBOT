const axios = require('axios');
module.exports = async (sock, msg, from, args) => {
    const ville = args.join(' ');
    if (!ville) return sock.sendMessage(from, { text: '❌ !meteo <ville>' });
    try {
        const res = await axios.get(`https://wttr.in/${encodeURIComponent(ville)}?format=%C+%t+%w+%h`);
        const data = res.data;
        await sock.sendMessage(from, { text: `🌤️ *Météo pour ${ville}* :\n${data}` });
    } catch {
        await sock.sendMessage(from, { text: '❌ Ville introuvable.' });
    }
};
module.exports.description = '🌤️ Affiche la météo d’une ville (température, vent, humidité)';
