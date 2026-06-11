module.exports = async (sock, msg, from, args) => {
    const mode = args[0]?.toLowerCase();
    const text = args.slice(1).join(' ');
    if (!mode || !text) return sock.sendMessage(from, { text: '❌ !base64 encode|decode <texte>' });
    try {
        let result;
        if (mode === 'encode') result = Buffer.from(text).toString('base64');
        else if (mode === 'decode') result = Buffer.from(text, 'base64').toString('utf-8');
        else throw new Error();
        await sock.sendMessage(from, { text: `📦 *Base64 ${mode}* :\n${result}` });
    } catch {
        await sock.sendMessage(from, { text: '❌ Erreur. Vérifie le format.' });
    }
};
module.exports.description = '📦 Encode ou décode un texte en Base64';
