import React, { useCallback, useState } from 'react';
import useAsyncList from '../hooks/useAsyncList.js';
import api from '../services/api.js';
import { getApiErrorMessage } from '../utils/errors.js';
import ModuleState from './ModuleState.jsx';

const formatEventDate = (date) =>
  new Intl.DateTimeFormat('en', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(date));

const EventsModule = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const loadEvents = useCallback(async () => {
    const { data } = await api.get('/events');
    return data;
  }, []);

  const { error, isLoading, items: events, setError, setItems: setEvents } =
    useAsyncList({
      fallbackError: 'AI assistant could not load your schedule. Please try again.',
      loadItems: loadEvents
    });

  const handleCreateEvent = async (event) => {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle || !date) {
      return;
    }

    try {
      setIsCreating(true);
      setError('');
      const { data } = await api.post('/events', {
        title: trimmedTitle,
        description: trimmedDescription,
        date
      });

      setEvents((currentEvents) =>
        [...currentEvents, data].sort(
          (firstEvent, secondEvent) =>
            new Date(firstEvent.date) - new Date(secondEvent.date)
        )
      );
      setTitle('');
      setDescription('');
      setDate('');
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, 'Could not add this schedule item. Please try again.')
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      setError('');
      await api.delete(`/events/${eventId}`);
      setEvents((currentEvents) =>
        currentEvents.filter((currentEvent) => currentEvent._id !== eventId)
      );
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, 'Could not remove this schedule item. Please try again.')
      );
    }
  };

  return (
    <article className="dashboard-card events-card">
      <div className="card-heading">
        <div>
          <h2>Smart Schedule</h2>
          <p>Upcoming calendar context</p>
        </div>
        <span>{events.length}</span>
      </div>

      <form className="event-form" onSubmit={handleCreateEvent}>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Schedule item"
        />
        <input
          type="datetime-local"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Context for the assistant"
          rows="3"
        />
        <button type="submit" disabled={isCreating || !title.trim() || !date}>
          Add to schedule
        </button>
      </form>

      {error && <ModuleState tone="error">{error}</ModuleState>}

      <div className="event-list">
        {isLoading ? (
          <ModuleState tone="loading">AI is reading your schedule...</ModuleState>
        ) : events.length === 0 ? (
          <ModuleState>No schedule items yet. Add one above.</ModuleState>
        ) : (
          events.map((currentEvent) => (
            <div className="event-item" key={currentEvent._id}>
              <div>
                <time dateTime={currentEvent.date}>
                  {formatEventDate(currentEvent.date)}
                </time>
                <h3>{currentEvent.title}</h3>
                {currentEvent.description && <p>{currentEvent.description}</p>}
              </div>
              <button
                className="event-delete"
                type="button"
                onClick={() => handleDeleteEvent(currentEvent._id)}
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </article>
  );
};

export default EventsModule;
