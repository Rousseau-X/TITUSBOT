const axios = require('axios');
module.exports = async (sock, msg, from, args) => {
    const song = args.join(' ');
    if (!song) return sock.sendMessage(from, { text: '❌ !lyrics <artiste - titre>' });
    try {
        const res = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(song)}`);
        let lyrics = res.data.lyrics;
        if (lyrics.length > 2000) lyrics = lyrics.substring(0, 1997) + '...';
        await sock.sendMessage(from, { text: `🎤 *Paroles de ${song}* :\n${lyrics}` });
    } catch {
        await sock.sendMessage(from, { text: '❌ Paroles non trouvées.' });
    }
};
module.exports.description = '🎤 Affiche les paroles d’une chanson';
