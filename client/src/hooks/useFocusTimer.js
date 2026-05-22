import { useCallback, useEffect, useMemo, useState } from 'react';

const duration = 25 * 60;
const storageKey = 'dailyflowFocusTimer';

const defaultState = {
  completedSessions: 0,
  isRunning: false,
  remainingSeconds: duration,
  startedAt: null
};

const readState = () => {
  try {
    return {
      ...defaultState,
      ...JSON.parse(localStorage.getItem(storageKey))
    };
  } catch {
    return defaultState;
  }
};

const writeState = (state) => {
  localStorage.setItem(storageKey, JSON.stringify(state));
  window.dispatchEvent(new Event('dailyflow:focus-updated'));
};

const getCurrentState = () => {
  const state = readState();

  if (!state.isRunning || !state.startedAt) {
    return state;
  }

  const elapsedSeconds = Math.floor((Date.now() - state.startedAt) / 1000);
  const remainingSeconds = Math.max(state.remainingSeconds - elapsedSeconds, 0);

  if (remainingSeconds > 0) {
    return {
      ...state,
      remainingSeconds
    };
  }

  return {
    ...defaultState,
    completedSessions: state.completedSessions + 1
  };
};

export const formatFocusTime = (seconds) => {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0');

  return `${minutes}:${remainingSeconds}`;
};

const useFocusTimer = () => {
  const [timer, setTimer] = useState(getCurrentState);

  const syncTimer = useCallback(() => {
    const storedState = readState();
    const nextState = getCurrentState();
    setTimer(nextState);

    if (storedState.isRunning && !nextState.isRunning) {
      writeState(nextState);
    }
  }, []);

  useEffect(() => {
    syncTimer();
    window.addEventListener('dailyflow:focus-updated', syncTimer);

    const intervalId = window.setInterval(syncTimer, 1000);

    return () => {
      window.removeEventListener('dailyflow:focus-updated', syncTimer);
      window.clearInterval(intervalId);
    };
  }, [syncTimer]);

  const start = () => {
    writeState({
      ...timer,
      isRunning: true,
      startedAt: Date.now()
    });
  };

  const pause = () => {
    writeState({
      ...getCurrentState(),
      isRunning: false,
      startedAt: null
    });
  };

  const reset = () => {
    writeState({
      ...defaultState,
      completedSessions: getCurrentState().completedSessions
    });
  };

  const progress = useMemo(() => {
    return ((duration - timer.remainingSeconds) / duration) * 100;
  }, [timer.remainingSeconds]);

  return {
    ...timer,
    duration,
    pause,
    progress,
    reset,
    start
  };
};

export default useFocusTimer;
