import React, { useEffect, useState } from 'react';
import api from '../services/api.js';

const formatEventDate = (date) =>
  new Intl.DateTimeFormat('en', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(date));

const EventsModule = () => {
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const loadEvents = async () => {
    try {
      setError('');
      const { data } = await api.get('/events');
      setEvents(data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Could not load events. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

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
        requestError.response?.data?.message ||
          'Could not create event. Please try again.'
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
        requestError.response?.data?.message ||
          'Could not delete event. Please try again.'
      );
    }
  };

  return (
    <article className="dashboard-card events-card">
      <div className="card-heading">
        <div>
          <h2>Events</h2>
          <p>Upcoming calendar events</p>
        </div>
        <span>{events.length}</span>
      </div>

      <form className="event-form" onSubmit={handleCreateEvent}>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Event title"
        />
        <input
          type="datetime-local"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description"
          rows="3"
        />
        <button type="submit" disabled={isCreating || !title.trim() || !date}>
          Add event
        </button>
      </form>

      {error && <p className="event-error">{error}</p>}

      <div className="event-list">
        {isLoading ? (
          <p className="event-empty">Loading events...</p>
        ) : events.length === 0 ? (
          <p className="event-empty">No events yet. Add your first event above.</p>
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
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </article>
  );
};

export default EventsModule;
