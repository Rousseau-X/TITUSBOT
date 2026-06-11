const axios = require('axios');
module.exports = async (sock, msg, from, args) => {
    const name = args.join(' ');
    if (!name) return sock.sendMessage(from, { text: '❌ !anime <nom>' });
    try {
        const res = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(name)}&limit=1`);
        const anime = res.data.data[0];
        if (!anime) throw new Error();
        const text = `🎬 *${anime.title}*\n⭐ Note : ${anime.score}/10\n📅 Sortie : ${anime.year || 'N/A'}\n📝 Synopsis : ${anime.synopsis?.substring(0, 200)}...`;
        await sock.sendMessage(from, { text });
    } catch {
        await sock.sendMessage(from, { text: '❌ Anime non trouvé.' });
    }
};
module.exports.description = '🎬 Cherche un animé (titre, note, synopsis)';
