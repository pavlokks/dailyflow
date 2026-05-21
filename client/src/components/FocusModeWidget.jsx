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

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setRemainingSeconds(focusDuration);
  };

  return (
    <article className="dashboard-card focus-mode-card">
      <div className="card-heading">
        <div>
          <h2>Focus Mode</h2>
          <p>25-minute Pomodoro session</p>
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
            <p>{isRunning ? 'Focus in progress' : 'Ready to focus'}</p>
          </div>
        </div>
      </div>

      <div className="focus-actions">
        <button type="button" onClick={handleStart} disabled={isRunning}>
          Start
        </button>
        <button type="button" onClick={handlePause} disabled={!isRunning}>
          Pause
        </button>
        <button type="button" onClick={handleReset}>
          Reset
        </button>
      </div>

      <p className="focus-sessions">
        Completed focus sessions: <strong>{completedSessions}</strong>
      </p>
    </article>
  );
};

export default FocusModeWidget;
