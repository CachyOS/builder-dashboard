import {ReadonlyHeaders} from 'next/dist/server/web/spec-extension/adapters/headers';
import stripAnsi from 'strip-ansi';

import {
  APIVersion,
  AuditLogList,
  AuditLogListSchema,
  BasePackage,
  BasePackageSchema,
  BasePackageWithIDList,
  BasePackageWithIDListSchema,
  BulkRebuildPackagesResponse,
  BulkRebuildPackagesResponseSchema,
  ListPackageResponse,
  ListPackageResponseSchema,
  ListPackagesQuery,
  ListRepoActionsQuery,
  LoginRequest,
  LoginRequestSchema,
  LoginResponse,
  LoginResponseSchema,
  PackageList,
  PackageListSchema,
  PackageMArch,
  PackageStatsByMonthList,
  PackageStatsByMonthListSchema,
  PackageStatsList,
  PackageStatsListSchema,
  RebuildPackageList,
  RebuildPackageListSchema,
  RebuildPackageResponse,
  RebuildPackageResponseSchema,
  RepoActionsResponse,
  RepoActionsResponseSchema,
  ResponseType,
  SearchPackagesQuery,
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
      url: 'https://builder-api-1.cachyos.org/api',
    },
    {
      default: false,
      description: 'Standard Builder',
      name: 'CachyOS Standard',
      url: 'https://builder-api.cachyos.org/api',
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

  public async bulkRebuildPackages(
    packages: BasePackageWithIDList,
    clientHeaders = new Headers()
  ) {
    const request = BasePackageWithIDListSchema.safeParse(packages);

    if (!request.success) {
      throw new Error(
        `Invalid package list request: ${request.error.issues.map(issue => issue.message).join(', ')}`
      );
    }

    const response = await this._fetcher<BulkRebuildPackagesResponse>(
      'bulk-rebuild',
      clientHeaders,
      APIVersion.V1,
      {
        body: JSON.stringify(request.data),
        method: 'PUT',
      },
      ResponseType.JSON
    ).catch(() => []);

    const data = BulkRebuildPackagesResponseSchema.safeParse(response);

    if (!data.success) {
      throw new Error(
        `Invalid bulk rebuild packages response: ${data.error.issues.map(issue => issue.message).join(', ')}`
      );
    }

    return data.data;
  }

  public async getAuditLogs(clientHeaders = new Headers()) {
    const response = await this._fetcher<AuditLogList>(
      'audit-logs',
      clientHeaders,
      APIVersion.V2,
      {},
      ResponseType.JSON
    );
    const data = AuditLogListSchema.safeParse(response);
    if (!data.success) {
      throw new Error(
        `Invalid audit log response: ${data.error.issues.map(issue => issue.message).join(', ')}`
      );
    }
    return data.data;
  }

  public async getLoggedInUserProfile(clientHeaders = new Headers()) {
    const response = await this._fetcher<UserProfile>(
      'user-profile',
      clientHeaders,
      APIVersion.V1,
      {},
      ResponseType.JSON
    ).catch(() => ({}));
    const data = UserProfileSchema.safeParse(response);

    if (!data.success) {
      throw new Error(
        `Invalid user profile response: ${data.error.issues.map(issue => issue.message).join(', ')}`
      );
    }

    return data.data;
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

  public async getUserProfile(username: string, clientHeaders = new Headers()) {
    const response = await this._fetcher<UserProfile>(
      `profile/${username}`,
      clientHeaders,
      APIVersion.V1,
      {},
      ResponseType.JSON
    ).catch(() => ({}));

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

  public async listPackageStatsByCategory(clientHeaders = new Headers()) {
    const response = await this._fetcher<PackageStatsList>(
      `packages-stats?stat_type=category`,
      clientHeaders,
      APIVersion.V1,
      {},
      ResponseType.JSON
    );
    const data = PackageStatsListSchema.safeParse(response);
    if (!data.success) {
      throw new Error(
        `Invalid package stats response: ${data.error.issues.map(issue => issue.message).join(', ')}`
      );
    }
    return data.data;
  }

  public async listPackageStatsByMonth(clientHeaders = new Headers()) {
    const response = await this._fetcher<PackageStatsByMonthList>(
      `packages-stats?stat_type=month`,
      clientHeaders,
      APIVersion.V1,
      {},
      ResponseType.JSON
    );
    const data = PackageStatsByMonthListSchema.safeParse(response);
    if (!data.success) {
      throw new Error(
        `Invalid monthly package stats response: ${data.error.issues.map(issue => issue.message).join(', ')}`
      );
    }
    return data.data;
  }

  public async listRebuildPackages(clientHeaders = new Headers()) {
    const response = await this._fetcher<RebuildPackageList>(
      'rebuild-status',
      clientHeaders,
      APIVersion.V2,
      {},
      ResponseType.JSON
    );
    const data = RebuildPackageListSchema.safeParse(response);
    if (!data.success) {
      throw new Error(
        `Invalid package list response: ${data.error.issues.map(issue => issue.message).join(', ')}`
      );
    }
    return data.data;
  }

  public async listRepoActions(
    query?: ListRepoActionsQuery,
    clientHeaders = new Headers()
  ) {
    const requestQuery = new URLSearchParams();
    if (query) {
      if (query.march) {
        requestQuery.set('march', query.march.join(','));
      }
      if (query.repo) {
        requestQuery.set('repo', query.repo.join(','));
      }
      if (query.current_page) {
        requestQuery.set('current_page', query.current_page.toString());
      }
      if (query.page_size) {
        requestQuery.set('page_size', query.page_size.toString());
      }
    }

    const response = await this._fetcher<RepoActionsResponse>(
      `repo-actions?${requestQuery.toString()}`,
      clientHeaders,
      APIVersion.V1,
      {},
      ResponseType.JSON
    );
    const data = RepoActionsResponseSchema.safeParse(response);
    if (!data.success) {
      throw new Error(
        `Invalid repo actions response: ${data.error.issues.map(issue => issue.message).join(', ')}`
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
      .join('\n');

    if (failedServers.length > 0) {
      if (
        allowInvalid &&
        failedServers.length !== CachyBuilderClient.servers.length
      ) {
        console.warn(
          `[User Login] Some servers failed to respond correctly, but continuing due to allowInvalid flag.\n${errors}`
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

  public async rebuildPackage(pkg: BasePackage, clientHeaders = new Headers()) {
    const request = BasePackageSchema.safeParse(pkg);
    if (!request.success) {
      throw new Error(
        `Invalid package request: ${request.error.issues.map(issue => issue.message).join(', ')}`
      );
    }

    const response = await this._fetcher<RebuildPackageResponse>(
      `rebuild/${pkg.march}/${pkg.repository}/${pkg.pkgbase}`,
      clientHeaders,
      APIVersion.V1,
      {
        method: 'PUT',
      },
      ResponseType.JSON
    ).catch(() => ({}));

    const data = RebuildPackageResponseSchema.safeParse(response);

    if (!data.success) {
      throw new Error(
        `Invalid rebuild package response: ${data.error.issues.map(issue => issue.message).join(', ')}`
      );
    }

    return data.data;
  }

  public async searchPackages(
    query: SearchPackagesQuery,
    clientHeaders = new Headers()
  ) {
    const requestQuery = new URLSearchParams();
    if (query.march_filter?.length) {
      requestQuery.set('march_filter', query.march_filter.join(','));
    }
    if (query.repo_filter?.length) {
      requestQuery.set('repo_filter', query.repo_filter.join(','));
    }
    if (query.status_filter?.length) {
      requestQuery.set('status_filter', query.status_filter.join(','));
    }
    if (query.search) {
      requestQuery.set('search', query.search);
    }

    const response = await this._fetcher<PackageList>(
      `packages-search?${requestQuery.toString()}`,
      clientHeaders,
      APIVersion.V1,
      {},
      ResponseType.JSON
    );
    const data = PackageListSchema.safeParse(response);
    if (!data.success) {
      throw new Error(
        `Invalid package list response: ${data.error.issues.map(issue => issue.message).join(', ')}`
      );
    }
    return data.data;
  }

  public async updateProfile(
    profile: UserProfile,
    updateAll = false,
    allowInvalid = false,
    clientHeaders = new Headers()
  ) {
    const request = UserProfileSchema.safeParse(profile);
    const updateServers = CachyBuilderClient.servers.filter(
      (_, i) => updateAll || i === this.serverIndex
    );

    if (updateServers.length === 0) {
      throw new Error('No servers to update profile on');
    }

    const responses = await Promise.all(
      updateServers.map(async s =>
        this._fetcher<UserProfile>(
          'user-profile',
          clientHeaders,
          APIVersion.V1,
          {
            body: JSON.stringify(request.data),
            method: 'PUT',
          },
          ResponseType.JSON,
          s.url
        ).catch(() => ({}))
      )
    );

    const data = responses.map(r => UserProfileSchema.safeParse(r));

    const failedServers = data.filter(d => !d.success);
    const errors = data
      .map((d, i) =>
        !d.success
          ? `Server: ${updateServers[i].name} ${d.error.issues.map(issue => issue.message).join(', ')}`
          : undefined
      )
      .filter(x => !!x)
      .join('\n');

    if (failedServers.length > 0) {
      if (allowInvalid && failedServers.length !== updateServers.length) {
        console.warn(
          `[Update User Profile] Some servers failed to respond correctly, but continuing due to allowInvalid flag.\n${errors}`
        );
      } else {
        throw new Error(`Invalid response from server(s):\n${errors}`);
      }
    }

    return {
      errors,
      profile: data.find(d => d.success)!.data,
      validServers: updateServers.filter((_, i) => data[i].success),
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
