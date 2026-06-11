module.exports = async (sock, msg, from, args) => {
    let length = parseInt(args[0]) || 12;
    if (length < 6) length = 6;
    if (length > 32) length = 32;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars[Math.floor(Math.random() * chars.length)];
    }
    await sock.sendMessage(from, { text: `🔐 *Mot de passe* (${length} caractères) :\n${password}` });
};
module.exports.description = '🔐 Génère un mot de passe aléatoire sécurisé';
