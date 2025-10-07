/**
 * - Orchestrates the main UI: Lobby -> Quiz -> Finished screens
 * - Manages connection state and wires socket events to React state
 * - Exposes host controls (Start, Next, Restart) based on a simple heuristic
 */
import React, { useEffect, useState } from 'react';
import { socket } from './socket';
import Lobby from './components/Lobby.jsx';
import Quiz from './components/Quiz.jsx';
import Leaderboard from './components/Leaderboard.jsx';

export default function App() {
  const [connected, setConnected] = useState(false);
  const [quizState, setQuizState] = useState('lobby'); // 'lobby' | 'running' | 'finished'
  const [leaderboard, setLeaderboard] = useState([]);
  const [question, setQuestion] = useState(null);
  const [isHost, setIsHost] = useState(false);

  // Register socket listeners once on mount
  useEffect(() => {
    const onConnect = () => { setConnected(true); };
    const onDisconnect = () => { setConnected(false); };
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('quizState', (state) => setQuizState(state.state));
    socket.on('leaderboard', (data) => setLeaderboard(data));
    socket.on('question', (q) => setQuestion(q));
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('quizState');
      socket.off('leaderboard');
      socket.off('question');
    };
  }, []);

  const join = (name) => {
    socket.emit('joinQuiz', { nickname: name });
    // Heuristic: first joiner becomes host
    setTimeout(() => { setIsHost((prev) => prev || (leaderboard?.length ?? 0) <= 1); }, 500);
  };
  const startQuiz = () => socket.emit('startQuiz');
  const nextQuestion = () => socket.emit('nextQuestion');
  const restartQuiz = (resetScores = true) => socket.emit('restartQuiz', { resetScores });
  const submitAnswer = (payload) => socket.emit('submitAnswer', payload);
  const requestLeaderboard = () => socket.emit('getLeaderboard');

  return (
    <div className="container">
      {/* Header with connection badge */}
      <div className="header">
        <div className="title">React Quiz Game</div>
        <div className="status">Status: <span className="badge">{connected ? 'Connected' : 'Disconnected'}</span></div>
      </div>

      <div className="grid">
        <div>
          {/* LOBBY */}
          {quizState === 'lobby' && (
            <div className="card">
              <Lobby onJoin={join} isHost={isHost} onStart={startQuiz} />
            </div>
          )}

          {/* RUNNING */}
          {quizState === 'running' && (
            <div className="card">
              {isHost && (
                <div className="stack" style={{ marginBottom: 8 }}>
                  <button className="btn" onClick={nextQuestion}>Next Question (Host)</button>
                </div>
              )}
              <Quiz question={question} onSubmit={submitAnswer} />
            </div>
          )}

          {/* FINISHED */}
          {quizState === 'finished' && (
            <div className="card">
              <h2>Quiz Finished 🎉</h2>
              <p className="muted">Great job! You can play again.</p>
              <div className="stack" style={{ marginTop: 8 }}>
                {isHost ? (
                  <>
                    <button className="btn primary" onClick={() => restartQuiz(true)}>Play Again (Reset Scores)</button>
                    <button className="btn" onClick={() => restartQuiz(false)}>Play Again (Keep Scores)</button>
                  </>
                ) : (
                  <span className="muted">Waiting for host to start a new round…</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Live leaderboard */}
        <div>
          <div className="card">
            <Leaderboard items={leaderboard} onRefresh={requestLeaderboard} />
          </div>
        </div>
      </div>
    </div>
  );
}
