const axios = require('axios');
module.exports = async (sock, msg, from, args) => {
    if (args.length < 3) return sock.sendMessage(from, { text: '❌ !devise <montant> <de> <vers>\nEx: !devise 1 EUR USD' });
    const amount = parseFloat(args[0]);
    const fromCurr = args[1].toUpperCase();
    const toCurr = args[2].toUpperCase();
    try {
        const res = await axios.get(`https://api.exchangerate-api.com/v4/latest/${fromCurr}`);
        const rate = res.data.rates[toCurr];
        if (!rate) throw new Error();
        const converted = (amount * rate).toFixed(2);
        await sock.sendMessage(from, { text: `💱 ${amount} ${fromCurr} = ${converted} ${toCurr}` });
    } catch {
        await sock.sendMessage(from, { text: '❌ Devise inconnue.' });
    }
};
module.exports.description = '💱 Conversion de devises (EUR, USD, etc.)';
