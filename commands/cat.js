const axios = require('axios');
module.exports = async (sock, msg, from) => {
    const res = await axios.get('https://api.thecatapi.com/v1/images/search', { responseType: 'json' });
    const url = res.data[0].url;
    await sock.sendMessage(from, { image: { url }, caption: '🐱 *Chat aléatoire*' });
};
module.exports.description = '🐱 Envoie une photo de chat aléatoire';
