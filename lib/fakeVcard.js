function getFakeVcard() {
    return {
        key: {
            remoteJid: "status@broadcast",
            fromMe: false,
            id: "TITUSBOT"
        },
        message: {
            contactMessage: {
                vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:TITUSBOT\nEND:VCARD`
            }
        }
    }
}

module.exports = getFakeVcard
