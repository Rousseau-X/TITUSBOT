module.exports = async (sock, msg, from) => {
    const roll = Math.floor(Math.random() * 6) + 1;
    const dice = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][roll-1];
    await sock.sendMessage(from, { text: `🎲 *Résultat* : ${dice} ${roll}` });
};
module.exports.description = '🎲 Lance un dé à 6 faces';
