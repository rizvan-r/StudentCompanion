import { useState, useCallback, useEffect } from 'react';

export function useApi(apiFunc, options = {}) {
  const { immediate = false, initialData = null, onSuccess, onError } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFunc(...args);
        setData(result);
        if (onSuccess) onSuccess(result);
        return result;
      } catch (err) {
        setError(err.message || 'Operation failed');
        if (onError) onError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunc, onSuccess, onError]
  );

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return { data, loading, error, execute, setData };
}
