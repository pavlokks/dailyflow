import React, { useCallback, useState } from 'react';
import { CalendarDays, Pencil, Plus, RotateCcw, Trash2, X } from 'lucide-react';
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
    year: 'numeric',
  }).format(new Date(date));

const formatDateTimeInput = (date) => {
  if (!date) return '';

  const parsedDate = new Date(date);
  parsedDate.setMinutes(parsedDate.getMinutes() - parsedDate.getTimezoneOffset());
  return parsedDate.toISOString().slice(0, 16);
};

const notifyEventsUpdated = () => {
  window.dispatchEvent(new Event('dailyflow:events-updated'));
};

const EventsModule = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [trashEvents, setTrashEvents] = useState([]);
  const [isTrashLoading, setIsTrashLoading] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');
  const [confirmDeleteAllAction, setConfirmDeleteAllAction] = useState('');

  const loadEvents = useCallback(async () => {
    const { data } = await api.get('/events');
    return data;
  }, []);

  const loadTrashEvents = useCallback(async () => {
    try {
      setIsTrashLoading(true);
      const { data } = await api.get('/events?trash=true');
      setTrashEvents(data);
    } catch {
      setTrashEvents([]);
    } finally {
      setIsTrashLoading(false);
    }
  }, []);

  const {
    error,
    isLoading,
    items: events,
    setError,
    setItems: setEvents,
  } = useAsyncList({
    fallbackError: 'Не вдалося завантажити події. Спробуйте ще раз.',
    loadItems: loadEvents,
  });

  React.useEffect(() => {
    loadTrashEvents();
  }, [loadTrashEvents]);

  const openEditEvent = (event) => {
    setEditEvent(event);
    setEditTitle(event.title || '');
    setEditDescription(event.description || '');
    setEditDate(formatDateTimeInput(event.date));
  };

  const closeEditEvent = () => {
    setEditEvent(null);
    setEditTitle('');
    setEditDescription('');
    setEditDate('');
  };

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
        date,
      });

      setEvents((currentEvents) =>
        [...currentEvents, data].sort(
          (firstEvent, secondEvent) => new Date(firstEvent.date) - new Date(secondEvent.date),
        ),
      );
      setTitle('');
      setDescription('');
      setDate('');
      notifyEventsUpdated();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Не вдалося додати подію. Спробуйте ще раз.'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      setError('');
      await api.delete(`/events/${eventId}`);
      setEvents((currentEvents) =>
        currentEvents.filter((currentEvent) => currentEvent._id !== eventId),
      );
      loadTrashEvents();
      notifyEventsUpdated();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Не вдалося видалити подію. Спробуйте ще раз.'));
    }
  };

  const handleClearEvents = async () => {
    if (events.length === 0) {
      return;
    }
    if (confirmDeleteAllAction !== 'events') {
      setConfirmDeleteAllAction('events');
      return;
    }

    try {
      setIsClearing(true);
      setError('');
      await Promise.all(events.map((event) => api.delete(`/events/${event._id}`)));
      setEvents([]);
      loadTrashEvents();
      notifyEventsUpdated();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Не вдалося видалити всі події.'));
    } finally {
      setIsClearing(false);
      setConfirmDeleteAllAction('');
    }
  };

  const handleUpdateEvent = async (event) => {
    event.preventDefault();

    if (!editEvent || !editTitle.trim() || !editDate) return;

    try {
      setError('');
      const { data } = await api.put(`/events/${editEvent._id}`, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        date: editDate,
      });

      setEvents((currentEvents) =>
        currentEvents
          .map((currentEvent) => (currentEvent._id === data._id ? data : currentEvent))
          .sort(
            (firstEvent, secondEvent) => new Date(firstEvent.date) - new Date(secondEvent.date),
          ),
      );
      closeEditEvent();
      notifyEventsUpdated();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Не вдалося оновити подію. Спробуйте ще раз.'));
    }
  };

  const handleRestoreEvent = async (eventId) => {
    try {
      setError('');
      const { data } = await api.put(`/events/${eventId}/restore`);
      setTrashEvents((currentEvents) =>
        currentEvents.filter((currentEvent) => currentEvent._id !== eventId),
      );
      setEvents((currentEvents) =>
        [...currentEvents, data].sort(
          (firstEvent, secondEvent) => new Date(firstEvent.date) - new Date(secondEvent.date),
        ),
      );
      notifyEventsUpdated();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Не вдалося відновити подію.'));
    }
  };

  const handlePermanentlyDeleteEvent = async (eventId) => {
    try {
      setError('');
      await api.delete(`/events/${eventId}/permanent`);
      setTrashEvents((currentEvents) =>
        currentEvents.filter((currentEvent) => currentEvent._id !== eventId),
      );
      notifyEventsUpdated();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Не вдалося видалити подію остаточно.'));
    }
  };

  const handleEmptyEventTrash = async () => {
    if (trashEvents.length === 0) return;
    if (confirmDeleteAllAction !== 'event-trash') {
      setConfirmDeleteAllAction('event-trash');
      return;
    }

    try {
      setError('');
      await api.delete('/events/trash');
      setTrashEvents([]);
      notifyEventsUpdated();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Не вдалося очистити кошик подій.'));
    } finally {
      setConfirmDeleteAllAction('');
    }
  };

  return (
    <article className='dashboard-card events-card'>
      <div className='card-heading'>
        <div>
          <h2>
            <CalendarDays size={18} /> Події
          </h2>
          <p>Керуйте своїм розкладом та дедлайнами.</p>
        </div>
        <span>{events.length}</span>
      </div>

      <form className='event-form' onSubmit={handleCreateEvent}>
        <input
          type='text'
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder='Назва події'
        />
        <input
          type='datetime-local'
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder='Опис події'
          rows='3'
        />
        <div className='event-form-actions'>
          <button type='submit' disabled={isCreating || !title.trim() || !date}>
            <Plus size={16} /> {isCreating ? 'Додаємо...' : 'Додати подію'}
          </button>
          <button
            className={
              confirmDeleteAllAction === 'events'
                ? 'ghost-danger-button bulk-delete-button bulk-delete-button-confirm'
                : 'ghost-danger-button bulk-delete-button'
            }
            type='button'
            disabled={isClearing || events.length === 0}
            onClick={handleClearEvents}
          >
            <Trash2 size={16} />{' '}
            {isClearing
              ? 'Очищення...'
              : confirmDeleteAllAction === 'events'
                ? 'Натисніть ще раз'
                : 'Видалити всі'}
          </button>
        </div>
      </form>

      {error && <ModuleState tone='error'>{error}</ModuleState>}

      <div className='event-list'>
        {isLoading ? (
          <ModuleState tone='loading'>Завантажуємо події...</ModuleState>
        ) : events.length === 0 ? (
          <ModuleState>
            Подій поки немає. Додайте першу дату, щоб не тримати її в голові.
          </ModuleState>
        ) : (
          events.map((currentEvent) => (
            <div className='event-item' key={currentEvent._id}>
              <div>
                <time dateTime={currentEvent.date}>{formatEventDate(currentEvent.date)}</time>
                <h3>{currentEvent.title}</h3>
                {currentEvent.description && <p>{currentEvent.description}</p>}
              </div>
              <div className='event-actions'>
                <button
                  className='event-edit'
                  type='button'
                  onClick={() => openEditEvent(currentEvent)}
                >
                  <Pencil size={15} /> Редагувати
                </button>
                <button
                  className='event-delete'
                  type='button'
                  onClick={() => handleDeleteEvent(currentEvent._id)}
                >
                  <Trash2 size={15} /> Видалити
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <section className='trash-panel'>
        <div className='trash-panel-heading'>
          <div>
            <h3>
              <Trash2 size={16} /> Кошик подій
            </h3>
            <p>{trashEvents.length} у кошику</p>
          </div>
          <button
            className={
              confirmDeleteAllAction === 'event-trash'
                ? 'ghost-danger-button bulk-delete-button bulk-delete-button-confirm'
                : 'ghost-danger-button bulk-delete-button'
            }
            type='button'
            disabled={trashEvents.length === 0}
            onClick={handleEmptyEventTrash}
          >
            {confirmDeleteAllAction === 'event-trash' ? 'Натисніть ще раз' : 'Видалити всі'}
          </button>
        </div>

        {isTrashLoading ? (
          <ModuleState tone='loading'>Завантажуємо кошик...</ModuleState>
        ) : trashEvents.length === 0 ? (
          <ModuleState>Кошик подій порожній.</ModuleState>
        ) : (
          <div className='trash-list'>
            {trashEvents.map((currentEvent) => (
              <div className='trash-item' key={currentEvent._id}>
                <div>
                  <strong>{currentEvent.title}</strong>
                  <span>{formatEventDate(currentEvent.date)}</span>
                </div>
                <div className='trash-actions'>
                  <button type='button' onClick={() => handleRestoreEvent(currentEvent._id)}>
                    <RotateCcw size={14} /> Відновити
                  </button>
                  <button
                    className='ghost-danger-button'
                    type='button'
                    onClick={() => handlePermanentlyDeleteEvent(currentEvent._id)}
                  >
                    <Trash2 size={14} /> Видалити остаточно
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {editEvent && (
        <div className='dashboard-modal-overlay' role='presentation'>
          <section className='dashboard-modal' role='dialog' aria-modal='true'>
            <div className='dashboard-modal-header'>
              <div>
                <h2>Редагувати подію</h2>
                <p>Оновіть назву, дату або опис події.</p>
              </div>
              <button
                className='modal-close-button'
                type='button'
                aria-label='Закрити'
                onClick={closeEditEvent}
              >
                <X size={18} />
              </button>
            </div>

            <form className='modal-edit-form' onSubmit={handleUpdateEvent}>
              <input
                type='text'
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
                placeholder='Назва події'
              />
              <input
                type='datetime-local'
                value={editDate}
                onChange={(event) => setEditDate(event.target.value)}
              />
              <textarea
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                placeholder='Опис'
                rows='3'
              />
              <div className='dashboard-modal-footer'>
                <button className='secondary-button' type='button' onClick={closeEditEvent}>
                  Скасувати
                </button>
                <button
                  className='add-generated-tasks'
                  type='submit'
                  disabled={!editTitle.trim() || !editDate}
                >
                  Зберегти
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </article>
  );
};

export default EventsModule;
