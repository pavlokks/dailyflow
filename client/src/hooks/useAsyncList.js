import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage } from '../utils/errors.js';

const useAsyncList = ({ fallbackError, loadItems }) => {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setError('');
      setIsLoading(true);
      const nextItems = await loadItems();
      setItems(nextItems);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, fallbackError));
    } finally {
      setIsLoading(false);
    }
  }, [fallbackError, loadItems]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    error,
    isLoading,
    items,
    refresh,
    setError,
    setItems
  };
};

export default useAsyncList;
