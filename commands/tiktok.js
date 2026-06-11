const axios = require('axios');

module.exports = async (sock, msg, from, args) => {
    const url = args[0];
    if (!url || !url.includes('tiktok.com')) {
        return sock.sendMessage(from, { text: '❌ Utilisation : !tiktok <lien TikTok>' });
    }

    await sock.sendMessage(from, { text: '⏳ Téléchargement en cours...' });

    try {
        // API publique pour télécharger sans watermark (à changer si elle tombe)
        const api = `https://api.ryzendesu.vip/api/downloader/ttdl?url=${encodeURIComponent(url)}`;
        const response = await axios.get(api);
        const data = response.data;

        if (data.status !== 200 || !data.result) {
            throw new Error('API error');
        }

        const videoUrl = data.result.video_no_watermark || data.result.video;
        if (!videoUrl) throw new Error('No video found');

        await sock.sendMessage(from, {
            video: { url: videoUrl },
            caption: '🎵 *TITUSBOT* – TikTok sans filigrane'
        });
    } catch (err) {
        console.error(err);
        await sock.sendMessage(from, { text: '❌ Erreur : impossible de télécharger la vidéo. L’API est peut-être indisponible.' });
    }
};

module.exports.description = '🎵 Télécharge une vidéo TikTok sans watermark (qualité maximale)';
