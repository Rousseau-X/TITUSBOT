const axios = require('axios');
module.exports = async (sock, msg, from, args) => {
    let coin = args[0]?.toLowerCase();
    if (!coin) return sock.sendMessage(from, { text: '❌ !crypto <btc|eth|doge|...>' });
    const map = { btc: 'bitcoin', eth: 'ethereum', doge: 'dogecoin', sol: 'solana', xrp: 'ripple' };
    coin = map[coin] || coin;
    try {
        const res = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd,eur`);
        const price = res.data[coin];
        if (!price) throw new Error();
        await sock.sendMessage(from, { text: `💰 *${coin.toUpperCase()}* :\n💵 USD : ${price.usd}\n💶 EUR : ${price.eur}` });
    } catch {
        await sock.sendMessage(from, { text: '❌ Cryptomonnaie inconnue.' });
    }
};
module.exports.description = '💰 Prix d’une cryptomonnaie (BTC, ETH, DOGE...)';
