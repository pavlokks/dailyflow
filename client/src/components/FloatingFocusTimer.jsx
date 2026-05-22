import React, { useEffect, useRef, useState } from 'react';
import { Grip, Pause, Play, RotateCcw, Timer } from 'lucide-react';
import useFocusTimer, { formatFocusTime } from '../hooks/useFocusTimer.js';

const positionKey = 'dailyflowFocusWidgetPosition';
const defaultPosition = { x: 24, y: 24 };

const readPosition = () => {
  try {
    return {
      ...defaultPosition,
      ...JSON.parse(localStorage.getItem(positionKey))
    };
  } catch {
    return defaultPosition;
  }
};

const FloatingFocusTimer = () => {
  const timer = useFocusTimer();
  const [position, setPosition] = useState(readPosition);
  const dragState = useRef(null);

  useEffect(() => {
    localStorage.setItem(positionKey, JSON.stringify(position));
  }, [position]);

  if (!timer.isRunning && timer.remainingSeconds === timer.duration) {
    return null;
  }

  const handlePointerDown = (event) => {
    dragState.current = {
      startX: event.clientX,
      startY: event.clientY,
      x: position.x,
      y: position.y
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!dragState.current) {
      return;
    }

    setPosition({
      x: Math.max(8, dragState.current.x - (event.clientX - dragState.current.startX)),
      y: Math.max(8, dragState.current.y - (event.clientY - dragState.current.startY))
    });
  };

  const handlePointerUp = () => {
    dragState.current = null;
  };

  return (
    <aside
      className="floating-focus"
      style={{ right: position.x, bottom: position.y }}
    >
      <div className="floating-focus-header">
        <p><Timer size={15} /> Фокус</p>
        <button
          className="floating-focus-grip"
          type="button"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          aria-label="Перемістити таймер"
        >
          <Grip size={15} />
        </button>
      </div>
      <strong>{formatFocusTime(timer.remainingSeconds)}</strong>
      <div className="floating-focus-actions">
        <button type="button" onClick={timer.isRunning ? timer.pause : timer.start}>
          {timer.isRunning ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <button type="button" onClick={timer.reset}>
          <RotateCcw size={15} />
        </button>
      </div>
    </aside>
  );
};

export default FloatingFocusTimer;
