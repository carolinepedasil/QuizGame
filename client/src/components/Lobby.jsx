/**
 * - Lets the player enter a nickname and join the room
 * - The first joiner is treated as the host and can start the quiz
 */
import React, { useState } from 'react';

export default function Lobby({ onJoin, isHost, onStart }) {
  const [name, setName] = useState('');

  return (
    <>
      <h2>Lobby</h2>
      <p className="muted">Enter your nickname and join the room. The first player becomes the host.</p>
      <div className="stack">
        <input className="input" placeholder="Nickname" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn primary" onClick={() => onJoin(name)} disabled={!name.trim()}>
          Join Quiz
        </button>
        {isHost && (
          <button className="btn success" onClick={onStart}>
            Start Quiz (Host)
          </button>
        )}
      </div>
    </>
  );
}
