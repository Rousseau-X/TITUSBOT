const fs = require("fs")

module.exports = async (sock, msg, from, args) => {
    // Charger toutes les commandes depuis le dossier commands
    const fichiers = fs.readdirSync("./commands").filter(f => f.endsWith(".js"))
    
    const commandesPubliques = []
    const commandesGroupe = []
    const commandesMedia = []

    fichiers.forEach(fichier => {
        const nom = fichier.replace(".js", "")
        const cmd = require(`./${fichier}`)
        const description = cmd.description || "Pas de description"

        // Trier par catégorie
        if (["ban", "promote", "demote", "mute", "unmute", "tagall", "groupinfo", "setwelcome", "setgoodbye"].includes(nom)) {
            commandesGroupe.push({ nom, description })
        } else if (["sticker", "toimg", "ytb", "ytmp3", "viewonce"].includes(nom)) {
            commandesMedia.push({ nom, description })
        } else {
            commandesPubliques.push({ nom, description })
        }
    })

    let texte = `
╔═══════════════════════╗
║   🤖 *TITUSBOT MENU*   ║
╚═══════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━
🌍 *COMMANDES GÉNÉRALES*
━━━━━━━━━━━━━━━━━━━━━━
`
    commandesPubliques.forEach((cmd, i) => {
        const prefix = i === commandesPubliques.length - 1 ? "└" : "├"
        texte += `${prefix} !${cmd.nom} — ${cmd.description}\n`
    })

    texte += `
━━━━━━━━━━━━━━━━━━━━━━
🎵 *COMMANDES MÉDIAS*
━━━━━━━━━━━━━━━━━━━━━━
`
    commandesMedia.forEach((cmd, i) => {
        const prefix = i === commandesMedia.length - 1 ? "└" : "├"
        texte += `${prefix} !${cmd.nom} — ${cmd.description}\n`
    })

    texte += `
━━━━━━━━━━━━━━━━━━━━━━
👥 *COMMANDES GROUPE*
━━━━━━━━━━━━━━━━━━━━━━
`
    commandesGroupe.forEach((cmd, i) => {
        const prefix = i === commandesGroupe.length - 1 ? "└" : "├"
        texte += `${prefix} !${cmd.nom} — ${cmd.description}\n`
    })

    texte += `
━━━━━━━━━━━━━━━━━━━━━━
_Propulsé par *TITUSBOT* 🚀_`

    await sock.sendMessage(from, {
        text: texte.trim()
    }, { quoted: msg })
}

module.exports.description = "📋 Affiche le menu complet du bot"
