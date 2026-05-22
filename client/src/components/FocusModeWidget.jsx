import React from 'react';
import { Pause, Play, RotateCcw, Timer } from 'lucide-react';
import useFocusTimer, { formatFocusTime } from '../hooks/useFocusTimer.js';

const FocusModeWidget = () => {
  const {
    completedSessions,
    isRunning,
    pause,
    progress,
    remainingSeconds,
    reset,
    start
  } = useFocusTimer();

  return (
    <article className="dashboard-card focus-mode-card">
      <div className="card-heading">
        <div>
          <h2><Timer size={18} /> Фокус</h2>
          <p>25 хвилин роботи без перемикань.</p>
        </div>
        <span>{completedSessions}</span>
      </div>

      <div className="focus-timer" aria-label="Pomodoro timer">
        <div
          className="focus-progress"
          style={{
            background: `conic-gradient(#2563eb ${progress}%, #e5e7eb ${progress}%)`
          }}
        >
          <div>
            <strong>{formatFocusTime(remainingSeconds)}</strong>
            <p>{isRunning ? 'Сесія триває' : 'Готово до старту'}</p>
          </div>
        </div>
      </div>

      <div className="focus-actions">
        <button type="button" onClick={start} disabled={isRunning}>
          <Play size={16} /> Старт
        </button>
        <button type="button" onClick={pause} disabled={!isRunning}>
          <Pause size={16} /> Пауза
        </button>
        <button type="button" onClick={reset}>
          <RotateCcw size={16} /> Скинути
        </button>
      </div>

      <p className="focus-sessions">
        Завершені сесії: <strong>{completedSessions}</strong>
      </p>
    </article>
  );
};

export default FocusModeWidget;
