const axios = require('axios');
module.exports = async (sock, msg, from, args) => {
    const longUrl = args[0];
    if (!longUrl || !longUrl.startsWith('http')) return sock.sendMessage(from, { text: '❌ !shorturl <https://...>' });
    try {
        const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
        await sock.sendMessage(from, { text: `🔗 *Lien raccourci* :\n${res.data}` });
    } catch {
        await sock.sendMessage(from, { text: '❌ Impossible de raccourcir.' });
    }
};
module.exports.description = '🔗 Raccourcit une URL (tinyurl)';
