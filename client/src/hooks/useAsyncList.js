import { useCallback, useEffect, useRef, useState } from 'react';
import { getApiErrorMessage } from '../utils/errors.js';

const useAsyncList = ({ fallbackError, loadItems }) => {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      setError('');
      if (!hasLoadedRef.current) {
        setIsLoading(true);
      }
      const nextItems = await loadItems();
      setItems(nextItems);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, fallbackError));
    } finally {
      hasLoadedRef.current = true;
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
