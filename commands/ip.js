const axios = require('axios');
module.exports = async (sock, msg, from, args) => {
    const ip = args[0];
    if (!ip) return sock.sendMessage(from, { text: '❌ !ip <adresse>' });
    try {
        const res = await axios.get(`http://ip-api.com/json/${ip}`);
        const data = res.data;
        if (data.status === 'fail') throw new Error();
        await sock.sendMessage(from, { text: `📍 *IP :* ${ip}\n🏙️ *Ville :* ${data.city}\n🌍 *Pays :* ${data.country}\n📡 *ISP :* ${data.isp}` });
    } catch {
        await sock.sendMessage(from, { text: '❌ IP invalide.' });
    }
};
module.exports.description = '📍 Infos sur une adresse IP';
