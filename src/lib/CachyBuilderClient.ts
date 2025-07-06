import {ReadonlyHeaders} from 'next/dist/server/web/spec-extension/adapters/headers';
import stripAnsi from 'strip-ansi';

import {
  APIVersion,
  ListPackageResponse,
  ListPackageResponseSchema,
  ListPackagesQuery,
  LoginRequest,
  LoginRequestSchema,
  LoginResponse,
  LoginResponseSchema,
  PackageMArch,
  ResponseType,
  UserProfile,
  UserProfileSchema,
} from '@/lib/typings';

export interface ServerToken {
  description: string;
  name: string;
  token: string;
  url: string;
}

export default class CachyBuilderClient {
  public static readonly servers = [
    {
      default: true,
      description: 'Zen4 Builder',
      name: 'CachyOS Zen4',
      url: 'https://builder-api.cachyos.org/api',
    },
    {
      default: false,
      description: 'Standard Builder',
      name: 'CachyOS Standard',
      url: 'https://builder-api-1.cachyos.org/api',
    },
  ];

  public baseURL: string;

  public get apiTokens() {
    return this.tokens;
  }

  public get serverIdx() {
    return this.serverIndex;
  }

  private serverIndex: number;
  private token: string;
  private tokens: ServerToken[];

  constructor(serverIndex: number, token: string) {
    if (serverIndex == -1 || serverIndex >= CachyBuilderClient.servers.length) {
      throw new Error(`Invalid Server Index: ${serverIndex}`);
    }
    this.serverIndex = serverIndex;
    this.baseURL = CachyBuilderClient.servers[this.serverIndex].url;
    this.token = token;
    this.tokens = CachyBuilderClient.servers.map(s => ({
      description: s.description,
      name: s.name,
      token: '',
      url: s.url,
    }));
  }

  public async getPackageLog(
    pkg: string,
    march: PackageMArch,
    strip = false,
    clientHeaders = new Headers()
  ): Promise<string> {
    return this._fetcher<string>(
      `logs/${march}/${pkg}.log`,
      clientHeaders,
      APIVersion.V1,
      {
        cache: 'no-store',
      },
      ResponseType.TEXT
    )
      .then(text => (strip ? stripAnsi(text) : text))
      .catch(() => '');
  }

  public async getUserProfile(clientHeaders = new Headers()) {
    const response = await this._fetcher<UserProfile>(
      'user-profile',
      clientHeaders,
      APIVersion.V1,
      {},
      ResponseType.JSON
    );
    const data = UserProfileSchema.safeParse(response);

    if (!data.success) {
      throw new Error(
        `Invalid user profile response: ${data.error.issues.map(issue => issue.message).join(', ')}`
      );
    }

    return data.data;
  }

  public async listPackages(
    query?: ListPackagesQuery,
    clientHeaders = new Headers()
  ) {
    const requestQuery = new URLSearchParams();
    if (query) {
      if (query.march_filter?.length) {
        requestQuery.set('march_filter', query.march_filter.join(','));
      }
      if (query.repo_filter?.length) {
        requestQuery.set('repo_filter', query.repo_filter.join(','));
      }
      if (query.status_filter?.length) {
        requestQuery.set('status_filter', query.status_filter.join(','));
      }
      if (query.current_page) {
        requestQuery.set('current_page', query.current_page.toString());
      }
      if (query.page_size) {
        requestQuery.set('page_size', query.page_size.toString());
      }
    }

    const response = await this._fetcher<ListPackageResponse>(
      `packages?${requestQuery.toString()}`,
      clientHeaders,
      APIVersion.V3,
      {},
      ResponseType.JSON
    );
    const data = ListPackageResponseSchema.safeParse(response);
    if (!data.success) {
      throw new Error(
        `Invalid package list response: ${data.error.issues.map(issue => issue.message).join(', ')}`
      );
    }
    return data.data;
  }

  public async login(
    loginRequest: LoginRequest,
    clientHeaders = new Headers(),
    allowInvalid = false
  ) {
    const request = LoginRequestSchema.safeParse(loginRequest);

    if (!request.success) {
      throw new Error(
        `Invalid login request: ${request.error.issues.map(issue => issue.message).join(', ')}`
      );
    }

    const responses = await Promise.all(
      CachyBuilderClient.servers.map(async s =>
        this._fetcher<LoginResponse>(
          'login',
          clientHeaders,
          APIVersion.V1,
          {
            body: JSON.stringify(request.data),
            method: 'POST',
          },
          ResponseType.JSON,
          s.url
        ).catch(() => ({token: ''}))
      )
    );

    const data = responses.map(r => LoginResponseSchema.safeParse(r));

    const failedServers = data.filter(d => !d.success);
    const errors = data
      .map((d, i) =>
        !d.success
          ? `Server: ${CachyBuilderClient.servers[i].name} ${d.error.issues.map(issue => issue.message).join(', ')}`
          : undefined
      )
      .filter(x => !!x)
      .join('\n ');

    if (failedServers.length > 0) {
      if (
        allowInvalid &&
        failedServers.length !== CachyBuilderClient.servers.length
      ) {
        console.warn(
          `Some servers failed to respond correctly, but continuing due to allowInvalid flag.\n${errors}`
        );
      } else {
        throw new Error(`Invalid response from server(s):\n${errors}`);
      }
    }

    this.tokens = data.map((d, i) => ({
      description: CachyBuilderClient.servers[i].description,
      name: CachyBuilderClient.servers[i].name,
      token: d.success ? d.data.token : '',
      url: CachyBuilderClient.servers[i].url,
    }));

    this.token = this.tokens[this.serverIndex].token;

    if (!this.token) {
      this.serverIndex = data.findIndex(d => d.success);
      if (this.serverIndex === -1) {
        throw new Error('No valid server found with a valid token.');
      }
      this.baseURL = CachyBuilderClient.servers[this.serverIndex].url;
      this.token = this.tokens[this.serverIndex].token;
    }

    return {
      errors,
      validServers: CachyBuilderClient.servers.filter(
        (_, i) => data[i].success
      ),
    };
  }

  public updateServer(server: string): void {
    const index = CachyBuilderClient.servers.findIndex(s => s.name === server);
    if (index === -1) {
      throw new Error(`Server not found: ${server}`);
    }
    this.serverIndex = index;
    this.baseURL = CachyBuilderClient.servers[this.serverIndex].url;
    this.token = this.tokens[index].token;
  }

  private async _fetcher<T>(
    endpoint: string,
    clientHeaders: ReadonlyHeaders,
    apiVersion = APIVersion.V1,
    requestInit?: RequestInit,
    responseMode = ResponseType.JSON,
    baseURLOverride = this.baseURL
  ): Promise<T> {
    return fetch(`${baseURLOverride}/${apiVersion}/${endpoint}`, {
      headers: {
        ...(this.token ? {Authorization: `Bearer ${this.token}`} : {}),
        'Content-Type': 'application/json',
        'User-Agent':
          clientHeaders.get('User-Agent') ??
          'CachyBuilderDashboardProxyServer/1.0.0',
        'X-Forwarded-For':
          clientHeaders.get('CF-Connecting-IP') ??
          clientHeaders.get('X-Forwarded-For') ??
          '',
        ...requestInit?.headers,
      },
      ...requestInit,
    }).then(res => this._processResponse<T>(res, responseMode));
  }

  private _processResponse<T>(
    response: Response,
    mode: ResponseType
  ): Promise<T> {
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
