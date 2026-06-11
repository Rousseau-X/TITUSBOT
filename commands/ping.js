module.exports = async (sock, msg, from) => {
    await sock.sendMessage(from, { text: "🏓 Pong !" });
};
module.exports.description = "🏓 Teste la connexion du bot";