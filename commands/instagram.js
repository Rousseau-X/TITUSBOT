const axios = require('axios');
module.exports = async (sock, msg, from, args) => {
    const url = args[0];
    if (!url || !url.includes('instagram.com')) return sock.sendMessage(from, { text: '❌ !instagram <lien>' });
    await sock.sendMessage(from, { text: '⏳ Téléchargement...' });
    try {
        const api = `https://api.videodl.live/instagram?url=${encodeURIComponent(url)}`;
        const res = await axios.get(api);
        const mediaUrl = res.data.url;
        if (mediaUrl.endsWith('.mp4')) {
            await sock.sendMessage(from, { video: { url: mediaUrl }, caption: '📸 Téléchargé par TITUSBOT' });
        } else {
            await sock.sendMessage(from, { image: { url: mediaUrl }, caption: '📸 Téléchargé par TITUSBOT' });
        }
    } catch {
        await sock.sendMessage(from, { text: '❌ Échec du téléchargement. Vérifie le lien.' });
    }
};
module.exports.description = '📸 Télécharge média Instagram (photo/vidéo)';
