import React, { useState } from 'react';
import { Bot, Send } from 'lucide-react';
import api from '../services/api.js';
import { getClientAIContext } from '../utils/aiContext.js';
import { getApiErrorMessage } from '../utils/errors.js';
import ModuleState from './ModuleState.jsx';

const AICommandCenter = () => {
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!message.trim()) return;

    try {
      setError('');
      setIsSending(true);
      const { data } = await api.post('/ai/command', {
        message: message.trim(),
        ...getClientAIContext(),
      });

      setReply(data.reply || '');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Не вдалося отримати відповідь помічника.'));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <article className='dashboard-card ai-command-card'>
      <div className='card-heading'>
        <div>
          <h2>
            <Bot size={18} /> Командний центр
          </h2>
          <p>Запитайте, як перепланувати день, з чого почати або що зараз ризикує зірватись.</p>
        </div>
      </div>

      <form className='ai-command-form' onSubmit={handleSubmit}>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder='Наприклад: переплануй мій день з урахуванням дедлайнів'
          rows='3'
        />
        <button type='submit' disabled={isSending || !message.trim()}>
          <Send size={16} /> {isSending ? 'Думаємо...' : 'Запитати'}
        </button>
      </form>

      {error && <ModuleState tone='error'>{error}</ModuleState>}
      {reply && <p className='ai-command-reply'>{reply}</p>}
    </article>
  );
};

export default AICommandCenter;
