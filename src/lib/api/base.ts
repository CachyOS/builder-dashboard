import {ReadonlyHeaders} from 'next/dist/server/web/spec-extension/adapters/headers';
import stripAnsi from 'strip-ansi';

import {APIVersion, ResponseType, UserScope} from '@/lib/typings';

export interface FetchOptions {
  authToken?: string;
  baseURL?: string;
  clientHeaders: Headers | ReadonlyHeaders;
  endpoint: string;
  init?: RequestInit;
  mode?: ResponseType;
  version?: APIVersion;
}

export interface ServerToken {
  description: string;
  name: string;
  scopes: UserScope[];
  token: string;
  url: string;
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body = ''
  ) {
    super(`HTTP ${status} ${statusText}${body ? `: ${body}` : ''}`);
    this.name = 'HttpError';
  }
}

export function isAccessibleToken(token: ServerToken): boolean {
  return token.token !== '' && token.scopes.length > 0;
}

export const SERVERS = [
  {
    default: true,
    description: 'Zen4 Builder',
    name: 'CachyOS Zen4',
    url: 'https://builder-api-1.cachyos.org/api',
  },
  {
    default: false,
    description: 'Standard Builder',
    name: 'CachyOS Standard',
    url: 'https://builder-api.cachyos.org/api',
  },
];

export class BaseClient {
  public static readonly servers = SERVERS;

  public baseURL: string;
  public serverIndex: number;
  public token: string;
  public tokens: ServerToken[];

  constructor(
    serverIndex: number,
    tokens: ServerToken[] = BaseClient.servers.map(s => ({
      description: s.description,
      name: s.name,
      scopes: [] as UserScope[],
      token: '',
      url: s.url,
    }))
  ) {
    if (serverIndex === -1 || serverIndex >= BaseClient.servers.length) {
      throw new Error(`Invalid Server Index: ${serverIndex}`);
    }
    this.serverIndex = serverIndex;
    this.baseURL = BaseClient.servers[this.serverIndex].url;
    this.token = tokens[serverIndex].token;
    this.tokens = tokens;
  }

  public async _fetcher<T>(opts: FetchOptions): Promise<T> {
    const {
      authToken = this.token,
      baseURL = this.baseURL,
      clientHeaders,
      endpoint,
      init,
      mode = ResponseType.JSON,
      version = APIVersion.V1,
    } = opts;
    return fetch(`${baseURL}/${version}/${endpoint}`, {
      ...init,
      headers: {
        ...(authToken ? {Authorization: `Bearer ${authToken}`} : {}),
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
    }).then(res => this._processResponse<T>(res, mode));
  }

  public async _processResponse<T>(
    response: Response,
    mode: ResponseType
  ): Promise<T> {
    if (!response.ok) {
      let body = '';
      try {
        body = await response.text();
      } catch {
        // ignore read errors
      }
      throw new HttpError(
        response.status,
        response.statusText,
        body ? stripAnsi(body) : ''
      );
    }
    switch (mode) {
      case ResponseType.JSON:
        return response.json() as Promise<T>;
      case ResponseType.RAW:
        return response.arrayBuffer() as Promise<T>;
      case ResponseType.TEXT:
        return response.text() as Promise<T>;
    }
  }
}
