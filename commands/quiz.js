const quizManager = require('../lib/quizManager');

module.exports = async (sock, msg, from, args) => {
    // Accepter groupes et discussions privées
    // Vérifier si un quiz est déjà en cours dans ce chat
    if (quizManager.getSession(from)) {
        return sock.sendMessage(from, { text: '⚠️ Un quiz est déjà en cours dans ce chat !' });
    }

    let numberOfQuestions = parseInt(args[0]);
    let difficulty = (args[1] || 'medium').toLowerCase();

    if (isNaN(numberOfQuestions) || numberOfQuestions < 1 || numberOfQuestions > 10) {
        return sock.sendMessage(from, { text: '❌ Utilisation : !quiz <nombre (1-10)> <difficulté (easy, medium, hard)>' });
    }

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
        difficulty = 'medium';
    }

    await sock.sendMessage(from, { text: `🧠 *Préparation du quiz...*\n➡️ ${numberOfQuestions} questions\n🎯 Difficulté : ${difficulty}\n\n⏳ Génération...` });

    const session = await quizManager.startNewSession(from, numberOfQuestions, difficulty);
    if (!session) {
        return sock.sendMessage(from, { text: '❌ Impossible de générer le quiz. Réessaie plus tard.' });
    }

    await askQuestion(sock, from, session.id);
};

async function askQuestion(sock, chatId, sessionId) {
    const { session } = quizManager.getSession(chatId);
    if (!session || session.finished) return;

    const q = session.questions[session.currentIndex];
    const responseDelay = Math.floor(Math.random() * 16) + 15; // 15-30 secondes
    session.questionStartTime = Date.now();
    session.responseDelay = responseDelay;
    quizManager.updateSession(sessionId, { questionStartTime: session.questionStartTime, responseDelay: session.responseDelay });

    const buttons = q.options.map((opt, idx) => ({
        buttonId: `quiz_ans_${idx}`,
        buttonText: { displayText: opt },
        type: 1
    }));

    await sock.sendMessage(chatId, {
        text: `📚 *Question ${session.currentIndex+1}/${session.totalQuestions}* (Difficulté : ${session.difficulty})\n\n${q.text}\n\n⏱️ *Temps imparti :* ${responseDelay} secondes`,
        buttons: buttons,
        headerType: 1
    });

    setTimeout(async () => {
        await showResults(sock, chatId, sessionId);
    }, responseDelay * 1000);
}

async function showResults(sock, chatId, sessionId) {
    const { session } = quizManager.getSession(chatId);
    if (!session || session.finished || session.awaitingNext) return;

    session.awaitingNext = true;
    quizManager.updateSession(sessionId, { awaitingNext: true });

    const results = quizManager.computeResultsForCurrentQuestion(sessionId);
    const totalParticipants = results.length;
    const correctCount = results.filter(r => r.correct).length;

    let resultsText = `📊 *Résultats de la question ${session.currentIndex+1}* (${session.responseDelay}s)\n\n`;
    resultsText += `✅ *Bonnes réponses :* ${correctCount}/${totalParticipants}\n\n`;
    resultsText += `👥 *Participants :*\n`;
    for (const res of results) {
        resultsText += `   ${res.correct ? '✅' : '❌'} @${res.id.split('@')[0]}\n`;
    }
    resultsText += `\n➡️ Cliquez sur "Question suivante" pour continuer.`;

    await sock.sendMessage(chatId, {
        text: resultsText,
        buttons: [{ buttonId: 'quiz_next', buttonText: { displayText: '➡️ Question suivante' }, type: 1 }],
        headerType: 1
    });
}

async function nextQuestion(sock, chatId, sessionId) {
    const { session } = quizManager.getSession(chatId);
    if (!session || session.finished) return;

    const hasNext = quizManager.moveToNextQuestion(sessionId);
    if (hasNext) {
        session.awaitingNext = false;
        quizManager.updateSession(sessionId, { awaitingNext: false });
        await askQuestion(sock, chatId, sessionId);
    } else {
        // Fin du quiz
        let finalText = `🏆 *Quiz terminé !* 🏆\n\n📊 *Classement final :*\n`;
        const sortedScores = Object.entries(session.scores).sort((a, b) => b[1] - a[1]);
        for (const [user, score] of sortedScores) {
            finalText += `   👤 @${user.split('@')[0]} : ${score} point(s)\n`;
        }
        await sock.sendMessage(chatId, { text: finalText });
        quizManager.deleteSession(sessionId);
    }
}

// Exports pour les interactions des boutons (appelés depuis index.js)
module.exports.handleQuizAnswer = async (sock, msg, from, buttonId) => {
    const match = buttonId.match(/quiz_ans_(\d+)/);
    if (!match) return false;
    const answerIdx = parseInt(match[1]);

    const sessionInfo = quizManager.getSession(from);
    if (!sessionInfo) return false;
    const session = sessionInfo.session;

    const participantId = msg.key.participant || msg.key.remoteJid;
    quizManager.addParticipant(session.id, participantId);
    const success = quizManager.recordAnswer(session.id, participantId, answerIdx);
    if (success) {
        await sock.sendMessage(from, { text: `✅ Réponse enregistrée pour @${participantId.split('@')[0]}!`, mentions: [participantId] }, { quoted: msg });
    } else {
        await sock.sendMessage(from, { text: `⚠️ Tu as déjà répondu à cette question !` }, { quoted: msg });
    }
    return true;
};

module.exports.handleQuizNext = async (sock, msg, from) => {
    const sessionInfo = quizManager.getSession(from);
    if (!sessionInfo) return false;
    // Tout le monde peut cliquer sur "Suivant" (pas de vérification admin)
    await nextQuestion(sock, from, sessionInfo.sessionId);
    return true;
};

module.exports.description = "📚 Lance un quiz (tout le monde peut jouer)";
