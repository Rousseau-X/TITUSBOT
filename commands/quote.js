module.exports = async (sock, msg, from, args) => {
    const citations = [
        "💡 *La vie, c'est comme une bicyclette, il faut avancer pour ne pas perdre l'équilibre.* — Albert Einstein",
        "🔥 *Le succès c'est d'aller d'échec en échec sans perdre son enthousiasme.* — Winston Churchill",
        "🌟 *Croyez en vous-même et tout sera possible.*",
        "💪 *La douleur est temporaire, la gloire est éternelle.*",
        "🚀 *Un grand voyage commence par un seul pas.* — Lao Tseu",
        "🎯 *Le seul moyen de faire du bon travail est d'aimer ce que vous faites.* — Steve Jobs",
        "⭐ *Tout ce que l'esprit peut concevoir, il peut l'accomplir.* — Napoleon Hill",
        "🌈 *Sois le changement que tu veux voir dans le monde.* — Gandhi",
        "💎 *Les obstacles sont ces choses que l'on voit quand on détourne les yeux du but.* — Henry Ford",
        "🏆 *Le succès appartient à ceux qui se lèvent tôt.* — Proverbe",
        "🌙 *Même la nuit la plus sombre prendra fin et le soleil se lèvera.* — Victor Hugo",
        "🦁 *Sois courageux. Prends des risques. Rien ne peut remplacer l'expérience.*",
        "🎵 *La musique donne une âme à nos cœurs et des ailes à la pensée.* — Platon",
        "🌺 *La gratitude transforme ce que nous avons en suffisance.*",
        "⚡ *Ne attends pas. Le moment ne sera jamais parfait.* — Napoleon Hill"
    ]

    const citation = citations[Math.floor(Math.random() * citations.length)]

    await sock.sendMessage(from, {
        text: `✨ *Citation du moment :*\n\n${citation}`
    }, { quoted: msg })
}

module.exports.description = "✨ Envoie une citation motivante aléatoire"
