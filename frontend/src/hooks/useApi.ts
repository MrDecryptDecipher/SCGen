import { useState, useCallback } from 'react';
import api, { ApiError } from '../services/api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

interface UseApiResponse<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

export function useApi<T>(
  apiMethod: (...args: any[]) => Promise<T>,
  options: {
    onSuccess?: (data: T) => void;
    onError?: (error: ApiError) => void;
    initialData?: T | null;
  } = {}
): UseApiResponse<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: options.initialData || null,
    loading: false,
    error: null
  });

  const reset = useCallback(() => {
    setState({
      data: options.initialData || null,
      loading: false,
      error: null
    });
  }, [options.initialData]);

  const execute = useCallback(
    async (...args: any[]) => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const response = await apiMethod(...args);
        setState(prev => ({ ...prev, data: response, loading: false }));
        options.onSuccess?.(response);
        return response;
      } catch (error) {
        const apiError = error as ApiError;
        setState(prev => ({ ...prev, error: apiError, loading: false }));
        options.onError?.(apiError);
        return null;
      }
    },
    [apiMethod, options]
  );

  return {
    ...state,
    execute,
    reset
  };
}

// Example usage:
export function useContractGeneration() {
  return useApi(
    (options) => api.post('/generate', options),
    {
      onSuccess: (data) => {
        console.log('Contract generated successfully:', data);
      },
      onError: (error) => {
        console.error('Contract generation failed:', error);
      }
    }
  );
}

export function useContractDeployment() {
  return useApi(
    (options) => api.post('/deploy', options),
    {
      onSuccess: (data) => {
        console.log('Contract deployed successfully:', data);
      },
      onError: (error) => {
        console.error('Contract deployment failed:', error);
      }
    }
  );
}

export function useContractVerification() {
  return useApi(
    (options) => api.post('/verify', options),
    {
      onSuccess: (data) => {
        console.log('Contract verified successfully:', data);
      },
      onError: (error) => {
        console.error('Contract verification failed:', error);
      }
    }
  );
} 