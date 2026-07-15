import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Custom hook for handling API calls with polling and error handling
 *
 * @param {Function} apiFunction - The async function to call
 * @param {Object} options - Configuration options
 * @param {number} options.pollInterval - Interval in ms between polls (default: 3000)
 * @param {Function} options.shouldStopPolling - Function to determine if polling should stop (optional)
 * @param {boolean} options.autoStart - Whether to start polling on mount (default: true)
 * @param {any} options.dependencies - Additional dependencies for useEffect (default: [])
 * @returns {Object} - { data, loading, error, refetch, stopPolling, startPolling }
 */
export function useApi(apiFunction, options = {}) {
  const {
    pollInterval = 3000,
    shouldStopPolling = null,
    autoStart = true,
    dependencies = [],
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(autoStart);
  const [error, setError] = useState(null);

  const timerRef = useRef(null);
  const isPollingRef = useRef(autoStart);

  /**
   * Execute the API call
   */
  const executeCall = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction();
      setData(result);

      // Check if we should stop polling
      if (shouldStopPolling && shouldStopPolling(result)) {
        stopPolling();
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, shouldStopPolling]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    isPollingRef.current = false;
  }, []);

  /**
   * Start polling
   */
  const startPolling = useCallback(async () => {
    if (isPollingRef.current) {
      return; // Already polling
    }

    isPollingRef.current = true;

    const poll = async () => {
      if (!isPollingRef.current) {
        return;
      }

      try {
        await executeCall();

        // Schedule next poll
        if (isPollingRef.current) {
          timerRef.current = setTimeout(poll, pollInterval);
        }
      } catch {
        // Error is already set in executeCall
        // Continue polling on error
        if (isPollingRef.current) {
          timerRef.current = setTimeout(poll, pollInterval);
        }
      }
    };

    // Execute immediately first, then schedule polling
    await executeCall();
    if (isPollingRef.current) {
      timerRef.current = setTimeout(poll, pollInterval);
    }
  }, [executeCall, pollInterval]);

  /**
   * Manual refetch (single call, not a poll)
   */
  const refetch = useCallback(() => {
    return executeCall();
  }, [executeCall]);

  /**
   * Setup polling on mount
   */
  useEffect(() => {
    if (autoStart) {
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [autoStart, startPolling, stopPolling, ...dependencies]);

  return {
    data,
    loading,
    error,
    refetch,
    stopPolling,
    startPolling,
  };
}
