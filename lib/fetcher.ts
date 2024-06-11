import {ReadonlyHeaders} from 'next/dist/server/web/spec-extension/adapters/headers';

import {defaultServer} from './servers';

export type ResponseType = 'json' | 'raw' | 'text';

export function processResponse<T>(
  response: Response,
  mode: ResponseType
): Promise<T> {
  switch (mode) {
    case 'json':
      return response.json() as Promise<T>;
    case 'raw':
      return response.arrayBuffer() as Promise<T>;
    case 'text':
      return response.text() as Promise<T>;
  }
}

export default async function fetcher<T>(
  path: string,
  sessionToken: string,
  clientHeaders: ReadonlyHeaders,
  init?: RequestInit,
  baseURL = defaultServer.url,
  responseMode: ResponseType = 'json'
): Promise<T> {
  return fetch(`${baseURL}${path}`, {
    cache: 'no-store',
    headers: {
      ...(sessionToken ? {Authorization: `Bearer ${sessionToken}`} : {}),
      'Content-Type': 'application/json',
      'User-Agent':
        clientHeaders.get('User-Agent') ??
        'CachyBuilderDashboardProxyServer/1.0.0',
      'X-Forwarded-For':
        clientHeaders.get('CF-Connecting-IP') ??
        clientHeaders.get('X-Forwarded-For') ??
        '',
      ...init?.headers,
    },
    ...init,
  }).then(res => processResponse<T>(res, responseMode));
}
