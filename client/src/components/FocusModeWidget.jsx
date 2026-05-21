import React, { useEffect, useMemo, useState } from 'react';

const focusDuration = 25 * 60;

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0');

  return `${minutes}:${remainingSeconds}`;
};

const FocusModeWidget = () => {
  const [remainingSeconds, setRemainingSeconds] = useState(focusDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setRemainingSeconds((currentSeconds) => {
        if (currentSeconds <= 1) {
          window.clearInterval(intervalId);
          setIsRunning(false);
          setCompletedSessions((currentSessions) => currentSessions + 1);
          return focusDuration;
        }

        return currentSeconds - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isRunning]);

  const progress = useMemo(() => {
    return ((focusDuration - remainingSeconds) / focusDuration) * 100;
  }, [remainingSeconds]);

  return (
    <article className="dashboard-card focus-mode-card">
      <div className="card-heading">
        <div>
          <h2>Фокус-режим</h2>
          <p>Pomodoro-сесія на 25 хвилин</p>
        </div>
        <span>{completedSessions}</span>
      </div>

      <div className="focus-timer" aria-label="Pomodoro timer">
        <div
          className="focus-progress"
          style={{
            background: `conic-gradient(#2563eb ${progress}%, #dbeafe ${progress}%)`
          }}
        >
          <div>
            <strong>{formatTime(remainingSeconds)}</strong>
            <p>{isRunning ? 'Фокус триває' : 'Готово до фокусу'}</p>
          </div>
        </div>
      </div>

      <div className="focus-actions">
        <button type="button" onClick={() => setIsRunning(true)} disabled={isRunning}>
          Старт
        </button>
        <button type="button" onClick={() => setIsRunning(false)} disabled={!isRunning}>
          Пауза
        </button>
        <button
          type="button"
          onClick={() => {
            setIsRunning(false);
            setRemainingSeconds(focusDuration);
          }}
        >
          Скинути
        </button>
      </div>

      <p className="focus-sessions">
        Завершені фокус-сесії: <strong>{completedSessions}</strong>
      </p>
    </article>
  );
};

export default FocusModeWidget;
