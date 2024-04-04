import {ReadonlyHeaders} from 'next/dist/server/web/spec-extension/adapters/headers';

export default async function fetcher<T>(
  path: string,
  sessionToken: string,
  clientHeaders: ReadonlyHeaders,
  init?: RequestInit
): Promise<T> {
  return fetch(`${process.env.CACHY_BUILDER_API_BASE_URL}${path}`, {
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
  }).then(res => res.json() as Promise<T>);
}
