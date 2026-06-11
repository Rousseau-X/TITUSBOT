
# 🤖 TITUSBOT – Le bot WhatsApp ultime

> Bot WhatsApp multifonctions, rapide et modulaire, conçu pour la modération, le divertissement et l’automatisation.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-20.x-green)
![WhatsApp](https://img.shields.io/badge/Baileys-6.7.2-brightgreen)
![License](https://img.shields.io/badge/license-MIT-orange)

---

## ✨ Fonctionnalités

| Catégorie | Commandes |
|-----------|-----------|
| 🛡️ **Modération** | `!ban`, `!kick`, `!mute`, `!unmute`, `!warn`, `!delwarn`, `!promote`, `!demote`, `!lock`, `!unlock`, `!antilink` |
| 🎉 **Divertissement** | `!ytb`, `!ytmp3`, `!tiktok`, `!sticker`, `!love`, `!quiz`, `!coinflip`, `!dice`, `!8ball` |
| 📊 **Utilitaires** | `!qr`, `!traduire`, `!meteo`, `!crypto`, `!bitcoin`, `!ip`, `!whois`, `!urlshort`, `!base64` |
| 👑 **Administration** | `!setwelcome`, `!setgoodbye`, `!tagall`, `!antidelete`, `!autoreact`, `!autoview`, `!backup` |
| 📜 **Information** | `!info`, `!menu`, `!ping`, `!stats`, `!uptime`, `!groupinfo` |
| 🤖 **IA & API** | `!ask` (Gemini), `!joke`, `!cat`, `!anime`, `!lyrics`, `!advice`, `!horoscope`, `!cocktail` |

---

## 🚀 Installation rapide

### Prérequis
- Node.js v20+ (ou v24)
- Termux (Android) ou tout serveur Linux

### Étapes

```bash
git clone https://github.com/Rousseau-X/TITUSBOT.git
cd TITUSBOT
npm install
npm start
```

Le bot génère un code de couplage – entre-le dans WhatsApp > Paramètres > Appareils liés > Lier un appareil.

---

⚙️ Configuration

Crée un fichier config.js à la racine :

```js
module.exports = {
    nomBot: "TITUSBOT",
    prefixe: "!",
    numeroBot: "2290129399467",
    proprietaire: "2290129399467"
};
```

Toutes les préférences (welcome, anti‑liens, warnings) sont stockées dans des fichiers JSON.

---

🧩 Structure du projet

```
TITUSBOT/
├── commands/          # Toutes les commandes (fichiers .js)
├── lib/               # Utilitaires (fakeVcard, quizManager)
├── session/           # Dossier de session WhatsApp (ignoré)
├── .gitignore         # Exclusions pour GitHub
├── index.js           # Cœur du bot
├── package.json
└── README.md
```

---

🎯 Exemples de commandes

· !ping → Pong !
· !ytb abdul et seb → recherche et télécharge la vidéo.
· !love @user1 @user2 → pourcentage d’amour + barre.
· !quiz 5 easy → quiz de 5 questions faciles.
· !ban (répondre au message) → bannit un membre.

---

🔧 Déploiement sur Render (optionnel)

1. Fork le dépôt sur GitHub.
2. Sur render.com → New Web Service → connecter GitHub.
3. Build command : npm install
4. Start command : npm start
5. Ajouter la variable d’environnement PHONE_NUMBER si besoin.

---

🤝 Contribuer

Les pull requests sont les bienvenues. Pour les gros changements, ouvre d’abord une issue.

---

📜 Licence

MIT – libre d’utilisation et de modification.

---

💬 Remerciements

· Baileys – la bibliothèque WhatsApp.
· OpenTriviaDB – pour les questions du quiz.
· Tous les testeurs.

✨ Développé avec ❤️ par Rousseau-X


