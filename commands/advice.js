const axios = require('axios');
module.exports = async (sock, msg, from) => {
    try {
        const res = await axios.get('https://api.adviceslip.com/advice');
        const advice = res.data.slip.advice;
        await sock.sendMessage(from, { text: `💡 *Conseil* :\n${advice}` });
    } catch {
        await sock.sendMessage(from, { text: '❌ Conseil indisponible.' });
    }
};
module.exports.description = '💡 Donne un conseil aléatoire en anglais';
