const axios = require('axios');

module.exports = async (sock, msg, from, args) => {
    if (args.length < 2) return sock.sendMessage(from, { text: '❌ !traduire <langue> <texte>\nEx: !traduire en Hello world' });
    const lang = args[0];
    const text = args.slice(1).join(' ');
    try {
        const res = await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${lang}`);
        const translation = res.data.responseData.translatedText;
        await sock.sendMessage(from, { text: `🌐 *Traduction (${lang})* :\n${translation}` });
    } catch (e) {
        await sock.sendMessage(from, { text: '❌ Erreur de traduction.' });
    }
};
module.exports.description = '🌐 Traduit du texte (fr, en, es, etc.)';
