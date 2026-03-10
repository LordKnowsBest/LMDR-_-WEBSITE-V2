'use client';
import { useState, useEffect, useCallback } from 'react';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Generic data-fetching hook. Calls the API function on mount
 * and exposes refresh/mutate controls.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useApi<T = any>(
  fetcher: () => Promise<{ data: any }>,
  deps: unknown[] = []
): UseApiState<T> & { refresh: () => void } {
  const [state, setState] = useState<UseApiState<T>>({ data: null, loading: true, error: null });

  const refresh = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcher()
      .then((res) => setState({ data: res.data, loading: false, error: null }))
      .catch((err) => setState({ data: null, loading: false, error: err.message }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { refresh(); }, [refresh]);

  return { ...state, refresh };
}

/**
 * Mutation hook for POST/PUT/DELETE actions.
 * Returns execute function + loading/error state.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useMutation<TInput, TOutput = any>(
  mutator: (input: TInput) => Promise<{ data: any }>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (input: TInput): Promise<TOutput | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await mutator(input);
      setLoading(false);
      return res.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
      return null;
    }
  }, [mutator]);

  return { execute, loading, error };
}
