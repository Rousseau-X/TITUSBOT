const { makeWASocket, useMultiFileAuthState, DisconnectReason, downloadContentFromMessage } = require("@whiskeysockets/baileys")
const pino = require("pino")
const config = require("./config")
const fs = require("fs")
const path = require("path")

let isConnected = false
let isReconnecting = false

// Chargement automatique des commandes
const commandes = {}
fs.readdirSync("./commands").forEach(fichier => {
    const nom = fichier.replace(".js", "")
    commandes[nom] = require(`./commands/${fichier}`)
})
console.log(`📦 ${Object.keys(commandes).length} commande(s) chargée(s) : ${Object.keys(commandes).join(", ")}`)

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("session")

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 15000,
        retryRequestDelayMs: 2000,
        defaultQueryTimeoutMs: 60000
    })

    // Pair Code
    if (!sock.authState.creds.registered) {
        await new Promise(resolve => setTimeout(resolve, 8000))
        try {
            const code = await sock.requestPairingCode(config.numeroBot)
            console.log(`\n🤖 TITUSBOT - Ton code : ${code}\n`)
        } catch (e) {
            console.log("❌ Erreur code, relance dans 5s...")
            setTimeout(() => startBot(), 5000)
            return
        }
    }

    sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
        if (connection === "open") {
            isConnected = true
            isReconnecting = false
            console.log("✅ TITUSBOT connecté avec succès !")

            await sock.sendMessage("2290129399467@s.whatsapp.net", {
                text: "🤖 *TITUSBOT* est connecté avec succès ! ✅"
            })

            await sock.sendMessage("2290129399467@s.whatsapp.net", {
                text: "📩 Bot prêt pour recevoir les messages !"
            })
        }

        if (connection === "close") {
            isConnected = false
            const code = lastDisconnect?.error?.output?.statusCode
            console.log("⚠️ Déconnexion — code :", code)

            if (code === DisconnectReason.loggedOut) {
                console.log("❌ Déconnecté définitivement !")
                process.exit(0)
            } else if (!isReconnecting) {
                isReconnecting = true
                console.log("🔄 Reconnexion dans 5 secondes...")
                setTimeout(() => {
                    isReconnecting = false
                    startBot()
                }, 5000)
            }
        }
    })

    sock.ev.on("creds.update", saveCreds)

    // Cache des messages pour antidelete
    const messageCache = {}

    // Vider le cache toutes les 5 heures
    setInterval(() => {
        const keys = Object.keys(messageCache)
        keys.forEach(key => delete messageCache[key])
        console.log("🧹 Cache antidelete vidé !")
    }, 5 * 60 * 60 * 1000)

    // Gestion des arrivées / départs dans les groupes
    sock.ev.on("group-participants.update", async (update) => {
        const groupId = update.id
        const participants = update.participants
        const action = update.action

        const settingsFile = path.join(__dirname, "group_settings.json")
        let settings = {}
        if (fs.existsSync(settingsFile)) {
            try {
                settings = JSON.parse(fs.readFileSync(settingsFile, "utf-8"))
            } catch (e) {}
        }
        const groupSetting = settings[groupId] || { welcome: true, goodbye: true }

        if ((action === "add" && !groupSetting.welcome) || (action === "remove" && !groupSetting.goodbye)) {
            return
        }

        let groupName = groupId
        try {
            const metadata = await sock.groupMetadata(groupId)
            groupName = metadata.subject
        } catch (e) {}

        for (const participant of participants) {
            let name = participant.split("@")[0]
            try {
                const [contact] = await sock.onWhatsApp(participant)
                if (contact && contact.name) name = contact.name
            } catch (e) {}

            if (action === "add") {
                await sock.sendMessage(groupId, {
                    text: `👋 *Bienvenue* ${name} dans *${groupName}* !`
                })
            } else if (action === "remove") {
                await sock.sendMessage(groupId, {
                    text: `😢 *Au revoir* ${name} ! On espère te revoir bientôt.`
                })
            }
        }
    })

    // Autoviewstatus et autoreactstatus
    sock.ev.on("messages.upsert", async ({ messages }) => {
        for (const msg of messages) {
            if (msg.key.remoteJid !== "status@broadcast") continue
            if (!msg.message) continue

            const settingsFile = path.join(__dirname, "statusconfig.json")
            let settings = {}
            if (fs.existsSync(settingsFile)) {
                try { settings = JSON.parse(fs.readFileSync(settingsFile, "utf-8")) } catch (e) {}
            }

            // Autoview
            if (settings.autoview) {
                try {
                    await sock.readMessages([msg.key])
                    console.log(`👁️ Statut vu : ${msg.key.participant}`)
                } catch (e) {
                    console.log("⚠️ Erreur autoview :", e.message)
                }
            }

            // Autoreact
            if (settings.autoreact) {
                try {
                    const emoji = settings.reactEmoji || "🔥"
                    await sock.sendMessage(msg.key.remoteJid, {
                        react: {
                            text: emoji,
                            key: msg.key
                        }
                    })
                    console.log(`🔥 Réaction envoyée à : ${msg.key.participant}`)
                } catch (e) {
                    console.log("⚠️ Erreur autoreact :", e.message)
                }
            }
        }
    })

    // Sauvegarder tous les messages dans le cache
    sock.ev.on("messages.upsert", async ({ messages }) => {
        messages.forEach(msg => {
            if (!msg.message) return
            messageCache[msg.key.id] = msg
        })
    })

    // Détecter les messages supprimés
    sock.ev.on("messages.update", async (updates) => {
        for (const update of updates) {
            const isDeleted = update.update?.message?.protocolMessage?.type === 0
            if (!isDeleted) continue

            const from = update.key.remoteJid
            if (!from.endsWith("@g.us")) continue

            const settingsFile = path.join(__dirname, "antidelete.json")
            let settings = {}
            if (fs.existsSync(settingsFile)) {
                try { settings = JSON.parse(fs.readFileSync(settingsFile, "utf-8")) } catch (e) {}
            }

            if (!settings[from]?.enabled) continue

            const deletedMsg = messageCache[update.key.id]
            if (!deletedMsg) continue

            const senderId = deletedMsg.key.participant ||
                             deletedMsg.key.remoteJid ||
                             update.key.participant
            const senderName = senderId ? senderId.split("@")[0] : "Inconnu"

            const proprietaire = config.proprietaire + "@s.whatsapp.net"

            const msgContent = deletedMsg.message
            const texte = msgContent?.conversation ||
                          msgContent?.extendedTextMessage?.text ||
                          msgContent?.imageMessage?.caption ||
                          msgContent?.videoMessage?.caption || ""

            try {
                if (texte) {
                    await sock.sendMessage(proprietaire, {
                        text: `🗑️ *MESSAGE SUPPRIMÉ*\n\n👤 *Auteur :* ${senderName}\n👥 *Groupe :* ${from}\n\n💬 *Message :*\n${texte}`
                    })
                }

                if (msgContent?.imageMessage) {
                    const stream = await downloadContentFromMessage(msgContent.imageMessage, "image")
                    let buffer = Buffer.from([])
                    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
                    await sock.sendMessage(proprietaire, {
                        image: buffer,
                        caption: `🗑️ *IMAGE SUPPRIMÉE*\n👤 *Auteur :* ${senderName}`
                    })
                }

                if (msgContent?.videoMessage) {
                    const stream = await downloadContentFromMessage(msgContent.videoMessage, "video")
                    let buffer = Buffer.from([])
                    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
                    await sock.sendMessage(proprietaire, {
                        video: buffer,
                        caption: `🗑️ *VIDÉO SUPPRIMÉE*\n👤 *Auteur :* ${senderName}`
                    })
                }

                if (msgContent?.audioMessage) {
                    const stream = await downloadContentFromMessage(msgContent.audioMessage, "audio")
                    let buffer = Buffer.from([])
                    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
                    await sock.sendMessage(proprietaire, {
                        audio: buffer,
                        mimetype: "audio/mpeg"
                    })
                }

            } catch (e) {
                console.log("⚠️ Erreur antidelete :", e.message)
            }

            delete messageCache[update.key.id]
        }
    })

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0]
        if (!msg.message) return

        const texte = msg.message.conversation ||
                      msg.message.extendedTextMessage?.text || ""
        const from = msg.key.remoteJid

        // Ignorer les statuts
        if (from === "status@broadcast") return

        // Vérification anti-spam
        if (from.endsWith("@g.us") && commandes["antispam"]) {
            await commandes["antispam"].checkSpam(sock, msg, from)
        }

        // Si session ytb active
        if (commandes["ytb"]?.sessions?.[from]) {
            if (msg.key.fromMe) return
            await commandes["ytb"](sock, msg, from)
            return
        }

        // Si session ytmp3 active
        if (commandes["ytmp3"]?.sessions?.[from]) {
            if (msg.key.fromMe) return
            await commandes["ytmp3"](sock, msg, from)
            return
        }

        // Laisser passer uniquement les commandes avec !
        if (texte.startsWith(config.prefixe)) {
            const args = texte.slice(1).trim().split(" ")
            const commande = args[0].toLowerCase()
            if (commandes[commande]) {
                await commandes[commande](sock, msg, from, args.slice(1))
            }
        }
    })
}

process.on("uncaughtException", (err) => {
    console.log("⚠️ Erreur interceptée :", err.message)
    if (!isConnected && !isReconnecting) {
        isReconnecting = true
        setTimeout(() => {
            isReconnecting = false
            startBot()
        }, 5000)
    }
})

process.on("unhandledRejection", (err) => {
    console.log("⚠️ Promesse rejetée :", err.message)
})

startBot()
