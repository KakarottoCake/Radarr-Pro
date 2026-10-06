import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { useMemo } from 'react';
import { ApiError } from './useApiQuery';

interface MutationOptions<T, TData> {
  path: string;
  method: 'POST' | 'PUT' | 'DELETE';
  headers?: HeadersInit;
  mutationOptions?: Omit<
    UseMutationOptions<T, ApiError, TData>,
    'mutationKey' | 'mutationFn'
  >;
}

const apiRoot = window.Radarr.apiRoot;

function useApiMutation<T, TData>(options: MutationOptions<T, TData>) {
  const { path, headers } = useMemo(() => {
    return {
      path: apiRoot + options.path,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
        'X-Api-Key': window.Radarr.apiKey,
      },
    };
  }, [options.path, options.headers]);

  return useMutation<T, ApiError, TData>({
    ...options.mutationOptions,
    mutationKey: [options.method, path],
    mutationFn: async (data: TData) => {
      const response = await fetch(path, {
        method: options.method,
        headers,
        body: data === undefined ? undefined : JSON.stringify(data),
      });

      if (!response.ok) {
        // eslint-disable-next-line init-declarations
        let body;

        try {
          body = await response.json();
        } catch {
          throw new ApiError(path, response.status, response.statusText);
        }

        throw new ApiError(path, response.status, response.statusText, body);
      }

      return response.json() as T;
    },
  });
}

export default useApiMutation;
