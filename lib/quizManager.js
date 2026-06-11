const axios = require('axios');
const fs = require('fs');
const path = require('path');

const SESSIONS_FILE = path.join(__dirname, '../quiz_sessions.json');

function loadSessions() {
    if (fs.existsSync(SESSIONS_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
        } catch (e) { return {}; }
    }
    return {};
}

function saveSessions(sessions) {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

let currentSessions = loadSessions();

function getSession(groupId) {
    for (const id in currentSessions) {
        if (currentSessions[id].groupId === groupId && !currentSessions[id].finished) {
            return { session: currentSessions[id], sessionId: id };
        }
    }
    return null;
}

async function getQuestionsFromAPI(amount, difficulty) {
    const url = `https://opentdb.com/api.php?amount=${amount}&difficulty=${difficulty}&type=multiple`;
    try {
        const response = await axios.get(url);
        if (response.data.response_code === 0) {
            return response.data.results.map(q => {
                const incorrect = q.incorrect_answers.map(ans => decodeURIComponent(ans));
                const correct = decodeURIComponent(q.correct_answer);
                const options = [...incorrect, correct];
                for (let i = options.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [options[i], options[j]] = [options[j], options[i]];
                }
                return {
                    text: decodeURIComponent(q.question),
                    options: options,
                    correct: options.indexOf(correct),
                };
            });
        } else {
            throw new Error(`API Error code: ${response.data.response_code}`);
        }
    } catch (error) {
        console.error("Erreur API Trivia:", error);
        return null;
    }
}

async function startNewSession(groupId, totalQuestions, difficulty) {
    const questions = await getQuestionsFromAPI(totalQuestions, difficulty);
    if (!questions) return null;
    const sessionId = Date.now().toString();
    currentSessions[sessionId] = {
        id: sessionId,
        groupId: groupId,
        totalQuestions: totalQuestions,
        currentIndex: 0,
        difficulty: difficulty,
        questions: questions,
        scores: {},
        responses: {},
        participants: new Set(),
        finished: false,
        startTime: Date.now(),
        questionStartTime: null,
        awaitingNext: false,
    };
    saveSessions(currentSessions);
    return currentSessions[sessionId];
}

function updateSession(sessionId, updates) {
    if (currentSessions[sessionId]) {
        currentSessions[sessionId] = { ...currentSessions[sessionId], ...updates };
        // Conversion Set pour la sauvegarde JSON (on le transforme en tableau)
        if (currentSessions[sessionId].participants instanceof Set) {
            currentSessions[sessionId].participants = Array.from(currentSessions[sessionId].participants);
        }
        saveSessions(currentSessions);
        // Restaurer le Set après sauvegarde
        if (Array.isArray(currentSessions[sessionId].participants)) {
            currentSessions[sessionId].participants = new Set(currentSessions[sessionId].participants);
        }
    }
}

function addParticipant(sessionId, participantId) {
    if (currentSessions[sessionId] && !currentSessions[sessionId].participants.has(participantId)) {
        currentSessions[sessionId].participants.add(participantId);
        updateSession(sessionId, { participants: currentSessions[sessionId].participants });
    }
}

function recordAnswer(sessionId, participantId, answerIndex) {
    const session = currentSessions[sessionId];
    if (!session) return false;
    if (session.responses[participantId]) return false;
    const currentQ = session.questions[session.currentIndex];
    const isCorrect = (answerIndex === currentQ.correct);
    session.responses[participantId] = {
        answerIndex: answerIndex,
        correct: isCorrect,
    };
    if (isCorrect) {
        if (!session.scores[participantId]) session.scores[participantId] = 0;
        session.scores[participantId]++;
    }
    updateSession(sessionId, { responses: session.responses, scores: session.scores });
    return true;
}

function computeResultsForCurrentQuestion(sessionId) {
    const session = currentSessions[sessionId];
    if (!session) return [];
    const results = [];
    for (const [participant, resp] of Object.entries(session.responses)) {
        results.push({
            id: participant,
            correct: resp.correct,
        });
    }
    return results;
}

function moveToNextQuestion(sessionId) {
    const session = currentSessions[sessionId];
    if (!session) return false;
    if (session.currentIndex + 1 < session.totalQuestions) {
        session.currentIndex++;
        session.responses = {};
        session.participants.clear();
        updateSession(sessionId, { currentIndex: session.currentIndex, responses: {}, participants: session.participants });
        return true;
    } else {
        session.finished = true;
        updateSession(sessionId, { finished: true });
        return false;
    }
}

function deleteSession(sessionId) {
    delete currentSessions[sessionId];
    saveSessions(currentSessions);
}

module.exports = {
    getSession,
    startNewSession,
    updateSession,
    addParticipant,
    recordAnswer,
    computeResultsForCurrentQuestion,
    moveToNextQuestion,
    deleteSession,
};
