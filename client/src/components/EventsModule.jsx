import React, { useCallback, useState } from 'react';
import { CalendarDays, Plus, Trash2 } from 'lucide-react';
import useAsyncList from '../hooks/useAsyncList.js';
import api from '../services/api.js';
import { getApiErrorMessage } from '../utils/errors.js';
import ModuleState from './ModuleState.jsx';

const formatEventDate = (date) =>
  new Intl.DateTimeFormat('uk-UA', {
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
  const [isClearing, setIsClearing] = useState(false);

  const loadEvents = useCallback(async () => {
    const { data } = await api.get('/events');
    return data;
  }, []);

  const { error, isLoading, items: events, setError, setItems: setEvents } =
    useAsyncList({
      fallbackError: 'Не вдалося завантажити події. Спробуйте ще раз.',
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
        getApiErrorMessage(requestError, 'Не вдалося додати подію. Спробуйте ще раз.')
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
        getApiErrorMessage(requestError, 'Не вдалося видалити подію. Спробуйте ще раз.')
      );
    }
  };

  const handleClearEvents = async () => {
    if (events.length === 0) {
      return;
    }

    try {
      setIsClearing(true);
      setError('');
      await Promise.all(events.map((event) => api.delete(`/events/${event._id}`)));
      setEvents([]);
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, 'Не вдалося видалити всі події.')
      );
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <article className="dashboard-card events-card">
      <div className="card-heading">
        <div>
          <h2><CalendarDays size={18} /> Події</h2>
          <p>Зустрічі, дедлайни та важливі дати.</p>
        </div>
        <span>{events.length}</span>
      </div>

      <form className="event-form" onSubmit={handleCreateEvent}>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Назва події"
        />
        <input
          type="datetime-local"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Опис події"
          rows="3"
        />
        <div className="event-form-actions">
          <button type="submit" disabled={isCreating || !title.trim() || !date}>
            <Plus size={16} /> {isCreating ? 'Додаємо...' : 'Додати подію'}
          </button>
          <button
            className="ghost-danger-button"
            type="button"
            disabled={isClearing || events.length === 0}
            onClick={handleClearEvents}
          >
            <Trash2 size={16} /> {isClearing ? 'Очищення...' : 'Видалити всі'}
          </button>
        </div>
      </form>

      {error && <ModuleState tone="error">{error}</ModuleState>}

      <div className="event-list">
        {isLoading ? (
          <ModuleState tone="loading">Завантажуємо події...</ModuleState>
        ) : events.length === 0 ? (
          <ModuleState>Подій поки немає. Додайте першу дату, щоб не тримати її в голові.</ModuleState>
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
                <Trash2 size={15} /> Видалити
              </button>
            </div>
          ))
        )}
      </div>
    </article>
  );
};

export default EventsModule;
