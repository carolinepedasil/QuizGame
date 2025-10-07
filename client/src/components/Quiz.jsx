/**
 * - Displays the current question and options
 * - Handles local timer display and submit action
 * - Shows immediate 'Answer Saved' feedback when the server confirms
 */
import React, { useEffect, useRef, useState } from 'react';

export default function Quiz({ question, onSubmit }) {
  const [selected, setSelected] = useState(null);  // which option the user picked
  const [remaining, setRemaining] = useState(0);   // seconds remaining for this question
  const [saved, setSaved] = useState(false);       // whether this player's answer is saved
  const timerRef = useRef(null);

  // When question changes, reset state and (re)start countdown
  useEffect(() => {
    setSelected(null);
    setSaved(false);
    if (!question) return;
    const deadline = Date.now() + (question.durationMs || 0);
    const tick = () => {
      const ms = Math.max(0, deadline - Date.now());
      setRemaining(Math.ceil(ms / 1000));
      if (ms <= 0) clearInterval(timerRef.current);
    };
    tick();
    clearInterval(timerRef.current);
    timerRef.current = setInterval(tick, 250);
    return () => clearInterval(timerRef.current);
  }, [question?.id]);

  // Listen for per-player confirmation ("saved: true") from server
  useEffect(() => {
    const handler = (res) => {
      if (res?.questionId === question?.id && res?.saved) setSaved(true);
    };
    window.__onAnswerSaved = handler;
    return () => { window.__onAnswerSaved = null; };
  }, [question?.id]);

  if (!question) return <p className="muted">Waiting for next question…</p>;

  const submit = () => {
    if (selected == null || saved) return;
    onSubmit({ questionId: question.id, answerIndex: selected });
  };

  // Percentage for the progress bar
  const pct = Math.max(0, Math.min(100, ((question.durationMs ? remaining / (question.durationMs/1000) : 0) * 100)));

  return (
    <div>
      <div className="stack" style={{ justifyContent: 'space-between' }}>
        <div className="muted">Question {question.index + 1} / {question.total}</div>
        <div className="badge">{remaining}s left</div>
      </div>
      <h2 style={{ marginTop: 8 }}>{question.text}</h2>

      <div className="stack" style={{ marginTop: 10 }}>
        {question.options.map((opt, i) => (
          <button
            key={i}
            className={`btn ${selected === i ? 'primary' : ''}`}
            onClick={() => setSelected(i)}
            disabled={saved}
          >
            {opt}
          </button>
        ))}
      </div>

      <div className="stack" style={{ marginTop: 12 }}>
        <button className="btn success" disabled={selected == null || saved} onClick={submit}>
          {saved ? 'Answer Saved ✔' : 'Save Answer'}
        </button>
      </div>

      <div className="progress"><div style={{ width: `${pct}%` }} /></div>
      {saved && <p className="muted" style={{ marginTop: 6 }}>Your answer is saved. Waiting for others…</p>}
    </div>
  );
}
