const axios = require('axios');
module.exports = async (sock, msg, from) => {
    try {
        const res = await axios.get('https://api.blagues-api.fr/random', {
            headers: { 'Authorization': 'Bearer ' } // pas de clé pour l'API publique ? Non, cette API nécessite une clé gratuite. Utilisons une autre.
        });
    } catch { }
    // Alternative sans clé : API "Blague.xyz"
    try {
        const res = await axios.get('https://blague.xyz/api/random');
        const joke = res.data.joke;
        await sock.sendMessage(from, { text: `😂 *Blague* :\n${joke}` });
    } catch {
        await sock.sendMessage(from, { text: '❌ Désolé, pas de blague pour l\'instant.' });
    }
};
module.exports.description = '😂 Envoie une blague aléatoire en français';
