module.exports = async (sock, msg, from) => {
    const result = Math.random() < 0.5 ? 'Pile' : 'Face';
    await sock.sendMessage(from, { text: `🪙 *${result}* !` });
};
module.exports.description = '🪙 Lance une pièce (pile ou face)';
