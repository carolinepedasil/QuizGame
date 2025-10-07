/**
 * Quiz Game Server (Express + Socket.IO)
 *
 * Purpose:
 *  - Host a real-time quiz where multiple clients join, answer questions, and see a live leaderboard.
 *  - Demonstrates client–server networking over TCP using WebSockets (Socket.IO).
 *
 * Key Ideas:
 *  - The server is authoritative for game state: current question, scores, timer, etc.
 *  - Clients send events (joinQuiz, submitAnswer, etc.); server responds/broadcasts updates.
 *  - CORS is configured for local dev and Render deployment.
 */

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import url from 'url';

/** ESM-friendly __dirname */
import path from 'path';
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

/** Create the Express app and wrap in a Node HTTP server */
const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);

/**
 * Configure Socket.IO with CORS.
 * - In development: allow localhost and 127.0.0.1 for the Vite client.
 * - In production (Render): allow the exact client origin via CLIENT_ORIGIN env var.
 */
const DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.CLIENT_ORIGIN].filter(Boolean)
  : DEV_ORIGINS;

const io = new Server(server, {
  cors: {
    origin: (origin, cb) => {
      // Allow no-origin (Postman, curl) or recognized origins
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked origin: ${origin}`));
    },
    methods: ['GET', 'POST']
  }
});

/**
 * Sample question set.
 */
const questions = [
  { id: 1, text: 'Which hook is used to manage state in a React function component?', options: ['useEffect','useState','useContext','useRef'], answerIndex: 1 },
  { id: 2, text: 'What prop is required to render a list with stable identity and avoid re-mounts?', options: ['id','key','index','ref'], answerIndex: 1 },
  { id: 3, text: 'Which hook runs after paint and is suitable for non-blocking effects?', options: ['useEffect','useLayoutEffect','useMemo','useCallback'], answerIndex: 0 },
  { id: 4, text: 'What should you avoid mutating directly to maintain predictability?', options: ['Props and state','DOM nodes','Context value','All of the above'], answerIndex: 3 }
];

/** In-memory game state (simple for MVP) */
const ROOM = 'default';                     // Single shared room for the MVP
let players = {};                           // socketId -> { nickname, score }
let currentQuestionIndex = -1;              // -1 means game not started
let acceptingAnswers = false;               // true during a question window
let questionTimer = null;                   // Node timeout for question duration
let answeredThisRound = new Set();          // Track who has already answered
const QUESTION_DURATION_MS = 15000;         // 15 seconds per question

/** Utility: clear per-question tracking */
function resetRoundTracking() { answeredThisRound = new Set(); }

/**
 * Utility: reset game state.
 * @param {Object} opts
 * @param {boolean} opts.resetScores Whether to zero out player scores when restarting.
 */
function resetGame({ resetScores = true } = {}) {
  if (resetScores) Object.values(players).forEach((p) => (p.score = 0));
  currentQuestionIndex = -1;
  acceptingAnswers = false;
  clearTimeout(questionTimer);
  questionTimer = null;
  resetRoundTracking();
}

/** Broadcast the current leaderboard to everyone in the room */
function broadcastLeaderboard() {
  const leaderboard = Object.values(players)
    .map((p) => ({ nickname: p.nickname, score: p.score }))
    .sort((a, b) => b.score - a.score);
  io.to(ROOM).emit('leaderboard', leaderboard);
}

/** How many active players are connected (size of players map) */
function activePlayerCount() { return Object.keys(players).length; }

/** End the current question and queue the next one after a short pause */
function endQuestionAndMaybeNext(summary = 'Time up!') {
  const q = questions[currentQuestionIndex];
  io.to(ROOM).emit('answerResult', {
    questionId: q.id,
    correctIndex: q.answerIndex,
    summary
  });
  broadcastLeaderboard();
  setTimeout(sendQuestion, 1500); // small delay to let players see the correct answer
}

/** Send the next question or finish the game if no more remain */
function sendQuestion() {
  currentQuestionIndex++;
  resetRoundTracking();

  // Ran out of questions -> finish
  if (currentQuestionIndex >= questions.length) {
    io.to(ROOM).emit('quizState', { state: 'finished' });
    broadcastLeaderboard();
    acceptingAnswers = false;
    return;
  }

  // Start a new question
  const { id, text, options } = questions[currentQuestionIndex];
  acceptingAnswers = true;

  io.to(ROOM).emit('question', {
    id,
    text,
    options,
    index: currentQuestionIndex,
    total: questions.length,
    durationMs: QUESTION_DURATION_MS
  });

  // Start/refresh the question timer
  clearTimeout(questionTimer);
  questionTimer = setTimeout(() => {
    acceptingAnswers = false;
    endQuestionAndMaybeNext('Time up!');
  }, QUESTION_DURATION_MS);
}

/** Socket.IO: main connection handler (one per client) */
io.on('connection', (socket) => {
  // A client joins the quiz by providing a nickname
  socket.on('joinQuiz', ({ nickname }) => {
    if (!nickname || typeof nickname !== 'string') {
      socket.emit('errorMsg', 'Nickname is required');
      return;
    }
    socket.join(ROOM);
    players[socket.id] = { nickname: nickname.trim().slice(0, 20), score: 0 };

    // If a round is already running, new joiners become spectators (state = running)
    socket.emit('quizState', {
      state: currentQuestionIndex >= 0 && currentQuestionIndex < questions.length ? 'running' : 'lobby'
    });
    broadcastLeaderboard();
  });

  // Host starts the first round
  socket.on('startQuiz', () => {
    if (currentQuestionIndex !== -1) return; // already started
    io.to(ROOM).emit('quizState', { state: 'running' });
    sendQuestion();
  });

  // Host restarts a new round (with or without resetting scores)
  socket.on('restartQuiz', ({ resetScores = true } = {}) => {
    resetGame({ resetScores });
    io.to(ROOM).emit('quizState', { state: 'running' });
    sendQuestion();
  });

  // Player submits an answer for the current question
  socket.on('submitAnswer', ({ questionId, answerIndex }) => {
    if (!acceptingAnswers) return;
    const q = questions[currentQuestionIndex];
    if (!q || q.id !== questionId) return;

    // Prevent multiple submissions per player per question
    if (answeredThisRound.has(socket.id)) return;
    answeredThisRound.add(socket.id);

    const player = players[socket.id];
    if (!player) return;

    const correct = Number(answerIndex) === q.answerIndex;
    if (correct) player.score += 10;

    // Confirm immediately to the specific player
    socket.emit('answerResult', {
      questionId,
      correctIndex: q.answerIndex,
      youWereCorrect: correct,
      saved: true
    });

    // Reflect the update for everyone
    broadcastLeaderboard();

    // If all active players answered, end early and advance
    const total = activePlayerCount();
    if (total > 0 && answeredThisRound.size >= total) {
      acceptingAnswers = false;
      clearTimeout(questionTimer);
      endQuestionAndMaybeNext('All players answered');
    }
  });

  // Host can manually skip to the next question
  socket.on('nextQuestion', () => {
    if (currentQuestionIndex === -1) return; // not started
    acceptingAnswers = false;
    clearTimeout(questionTimer);
    endQuestionAndMaybeNext('Advanced by host');
  });

  // Client explicitly requests leaderboard
  socket.on('getLeaderboard', () => broadcastLeaderboard());

  // Player leaves the room
  socket.on('leaveQuiz', () => {
    socket.leave(ROOM);
    delete players[socket.id];
    broadcastLeaderboard();
  });

  // Disconnection cleanup
  socket.on('disconnect', () => {
    delete players[socket.id];
    const total = activePlayerCount();
    if (acceptingAnswers && answeredThisRound.size >= total) {
      acceptingAnswers = false;
      clearTimeout(questionTimer);
      endQuestionAndMaybeNext('All remaining players answered');
    } else {
      broadcastLeaderboard();
    }
  });
});

/** Simple health check for testing/deployment */
app.get('/health', (_req, res) => res.json({ ok: true }));

/** Start the HTTP + WebSocket server */
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
