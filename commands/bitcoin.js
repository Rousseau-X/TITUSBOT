const axios = require('axios');
module.exports = async (sock, msg, from) => {
    try {
        const res = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur&include_24hr_change=true');
        const btc = res.data.bitcoin;
        await sock.sendMessage(from, { text: `₿ *Bitcoin* :\n💵 USD : ${btc.usd}\n💶 EUR : ${btc.eur}\n📈 24h : ${btc.usd_24h_change?.toFixed(2)}%` });
    } catch {
        await sock.sendMessage(from, { text: '❌ Prix indisponible.' });
    }
};
module.exports.description = '₿ Prix actuel du Bitcoin en USD et EUR';
