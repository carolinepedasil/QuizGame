/**
 * - Shows a live-updating, sorted list of players by score
 * - The parent (App) provides an onRefresh that can re-request from server
 */
import React from 'react';

export default function Leaderboard({ items, onRefresh }) {
  return (
    <>
      <h2>Leaderboard</h2>
      <div className="stack" style={{ marginBottom: 8, justifyContent: 'space-between' }}>
        <span className="muted">Scores update in real time</span>
        <button className="btn" onClick={onRefresh}>Refresh</button>
      </div>
      {(!items || items.length === 0) && <p className="muted">No players yet.</p>}
      <div>
        {items.map((p, idx) => (
          <div key={idx} className="leader-row">
            <span>{idx + 1}. {p.nickname}</span>
            <strong>{p.score}</strong>
          </div>
        ))}
      </div>
    </>
  );
}
