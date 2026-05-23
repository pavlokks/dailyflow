import React, { useEffect, useRef, useState } from 'react';
import { Grip, Pause, Play, RotateCcw, Timer } from 'lucide-react';
import useFocusTimer, { formatFocusTime } from '../hooks/useFocusTimer.js';
import { getUserStorageKey } from '../utils/userStorage.js';

const positionKey = 'dailyflowFocusWidgetPosition';
const defaultPosition = { x: 24, y: 24 };

const readPosition = () => {
  try {
    return {
      ...defaultPosition,
      ...JSON.parse(localStorage.getItem(getUserStorageKey(positionKey))),
    };
  } catch {
    return defaultPosition;
  }
};

const FloatingFocusTimer = () => {
  const timer = useFocusTimer();
  const [position, setPosition] = useState(readPosition);
  const dragState = useRef(null);
  const widgetRef = useRef(null);

  const clampPosition = (nextX, nextY) => {
    const el = widgetRef.current;
    const padding = 8;

    if (!el) {
      return {
        x: Math.max(padding, nextX),
        y: Math.max(padding, nextY),
      };
    }

    const maxX = window.innerWidth - el.offsetWidth - padding;
    const maxY = window.innerHeight - el.offsetHeight - padding;

    return {
      x: Math.max(padding, Math.min(nextX, maxX)),
      y: Math.max(padding, Math.min(nextY, maxY)),
    };
  };

  useEffect(() => {
    setPosition((currentPosition) => clampPosition(currentPosition.x, currentPosition.y));
  }, []);

  useEffect(() => {
    localStorage.setItem(getUserStorageKey(positionKey), JSON.stringify(position));
  }, [position]);

  if (!timer.isRunning && timer.remainingSeconds === timer.duration) {
    return null;
  }

  const handlePointerDown = (event) => {
    dragState.current = {
      startX: event.clientX,
      startY: event.clientY,
      x: position.x,
      y: position.y,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!dragState.current) {
      return;
    }

    const nextX = dragState.current.x - (event.clientX - dragState.current.startX);

    const nextY = dragState.current.y - (event.clientY - dragState.current.startY);

    setPosition(clampPosition(nextX, nextY));
  };

  const handlePointerUp = (event) => {
    dragState.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <aside
      ref={widgetRef}
      className='floating-focus'
      style={{ right: position.x, bottom: position.y }}
    >
      <div className='floating-focus-header'>
        <p>
          <Timer size={15} /> Таймер Помодоро
        </p>

        <button
          className='floating-focus-grip'
          type='button'
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          aria-label='Перемістити таймер'
        >
          <Grip size={15} />
        </button>
      </div>

      <strong>{formatFocusTime(timer.remainingSeconds)}</strong>

      <div className='floating-focus-actions'>
        <button type='button' onClick={timer.isRunning ? timer.pause : timer.start}>
          {timer.isRunning ? <Pause size={15} /> : <Play size={15} />}
        </button>

        <button type='button' onClick={timer.reset}>
          <RotateCcw size={15} />
        </button>
      </div>
    </aside>
  );
};

export default FloatingFocusTimer;
