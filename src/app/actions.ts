'use server';

import {getIronSession} from 'iron-session';
import {cookies, headers} from 'next/headers';
import {redirect} from 'next/navigation';

import CachyBuilderClient from '@/lib/CachyBuilderClient';
import {defaultSession, SessionData, sessionOptions} from '@/lib/session';
import {
  BasePackageListSchema,
  BasePackageWithIDList,
  BuildTimeStatsDataList,
  ListPackagesQuery,
  ListRepoActionsQuery,
  LoginRequest,
  LoginRequestSchema,
  PackageMArch,
  PackageRepo,
  PackageStatsList,
  PackageStatsType,
  ParsedAuditLogEntry,
  ParsedRepoAction,
  ProcessedPackageStatsByMonthList,
  SearchPackagesQuery,
  UserData,
  UserProfile,
} from '@/lib/typings';

export async function bulkRebuildPackages(packages: BasePackageWithIDList) {
  const {cachyBuilderClient, session} = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  try {
    const response = await cachyBuilderClient.bulkRebuildPackages(
      packages,
      await headers()
    );
    return response;
  } catch (error) {
    return {
      error: `Failed to bulk rebuild packages: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function changeServer(serverName: string) {
  const {session} = await getSession();
  const serverIndex = session.tokens.findIndex(
    token => token.name === serverName && token.token !== ''
  );
  if (serverIndex === -1) {
    return {
      error: `Server "${serverName}" not found or is not accessible with the current session.`,
    };
  }
  session.serverIndex = serverIndex;
  await session.save();
  return {
    msg: `Switched to server "${serverName}" successfully.`,
  };
}

export async function getAccessibleServers() {
  const {session} = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  return session.tokens.map((token, index) => ({
    accessible: token.token !== '',
    active: index === session.serverIndex,
    description: token.description,
    name: token.name,
  }));
}

export async function getAuditLogs() {
  const {cachyBuilderClient, session} = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  try {
    const logs = await cachyBuilderClient.getAuditLogs(await headers());
    return logs.map(item => {
      const description = item.event_desc;
      const packages: ParsedAuditLogEntry[] = [];
      if (description.startsWith('rebuild queued')) {
        const [pkgbase, repository, march] = description
          .replace('rebuild queued ', '')
          .split("'-'")
          .map(part => part.replace(/'/g, '').trim());
        packages.push({
          description: `Package Base: ${pkgbase}, Repository: ${repository}, MArch: ${march}`,
          id: `${item.id}-1`,
          updated: item.updated,
          username: item.username,
        });
      } else if (description.startsWith('bulk rebuild queued:')) {
        const packagesString = description
          .replace('bulk rebuild queued: ', '')
          .replace(/'/g, '')
          .trim();
        const packagesArray = BasePackageListSchema.safeParse(
          JSON.parse(packagesString)
        );
        if (packagesArray.success) {
          packagesArray.data.forEach((pkg, i) =>
            packages.push({
              description: `Package Base: ${pkg.pkgbase}, Repository: ${pkg.repository}, MArch: ${pkg.march}`,
              id: `${item.id}-${i + 1}`,
              updated: item.updated,
              username: item.username,
            })
          );
        }
      }
      return {
        description:
          packages.length > 1
            ? `Bulk Rebuild: ${packages.length} packages`
            : packages.shift()!.description,
        eventName: item.event_name,
        id: item.id,
        packages,
        updated: item.updated,
        username: item.username,
      };
    });
  } catch (error) {
    return {
      error: `Failed to get audit logs: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function getLoggedInUser(
  fullProfile: false
): Promise<UserData | {error: string}>;

export async function getLoggedInUser(
  fullProfile: true
): Promise<UserProfile | {error: string}>;

export async function getLoggedInUser(fullProfile = false) {
  const {cachyBuilderClient, session} = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  try {
    const user = await cachyBuilderClient.getLoggedInUserProfile(
      await headers()
    );
    session.displayName = user.display_name ?? user.username;
    session.username = user.username;
    session.profile_picture_url =
      user.profile_picture_url ?? '/cachyos-logo.svg';
    await session.save();
    if (fullProfile) {
      return user;
    }
    return {
      displayName: session.displayName,
      profile_picture_url: session.profile_picture_url,
      username: session.username,
    };
  } catch (error) {
    return {
      error: `Failed to get user profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function getPackageLog(
  pkg: string,
  march: PackageMArch,
  strip = false
) {
  const {cachyBuilderClient, session} = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  try {
    const log = await cachyBuilderClient.getPackageLog(
      pkg,
      march,
      strip,
      await headers()
    );
    return log;
  } catch (error) {
    return {
      error: `Failed to get package log: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function getPackageStats(
  type: PackageStatsType.CATEGORY
): Promise<PackageStatsList | {error: string}>;

export async function getPackageStats(
  type: PackageStatsType.MONTH
): Promise<ProcessedPackageStatsByMonthList | {error: string}>;

export async function getPackageStats(
  type: PackageStatsType.BUILD_TIME
): Promise<BuildTimeStatsDataList | {error: string}>;

export async function getPackageStats(
  type: PackageStatsType = PackageStatsType.CATEGORY
): Promise<
  | BuildTimeStatsDataList
  | PackageStatsList
  | ProcessedPackageStatsByMonthList
  | {error: string}
> {
  const {cachyBuilderClient, session} = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  try {
    if (type === PackageStatsType.MONTH) {
      const stats = await cachyBuilderClient.getPackageStatsByMonth(
        await headers()
      );
      return stats.map(stat => ({
        ...stat,
        reporting_month: new Date(stat.reporting_month * 1000)
          .toISOString()
          .slice(0, 7),
      }));
    } else if (type === PackageStatsType.CATEGORY) {
      return cachyBuilderClient.getPackageStatsByCategory(await headers());
    } else {
      return cachyBuilderClient.getBuildTimePackageStats(await headers());
    }
  } catch (error) {
    return {
      error: `Failed to get package stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
export async function getSession() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );
  if (!session.isLoggedIn) {
    session.displayName = defaultSession.displayName;
    session.isLoggedIn = defaultSession.isLoggedIn;
    session.tokens = defaultSession.tokens;
    session.createdAt = Date.now();
    session.serverIndex = defaultSession.serverIndex;
  }
  const cachyBuilderClient = new CachyBuilderClient(
    session.serverIndex,
    session.tokens[session.serverIndex].token
  );
  return {
    cachyBuilderClient,
    session,
  };
}

export async function getUser(username: string) {
  const {cachyBuilderClient, session} = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  try {
    const user = await cachyBuilderClient.getUserProfile(
      username,
      await headers()
    );
    return user;
  } catch (error) {
    return {
      error: `Failed to get user profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function isLoggedIn() {
  const {session} = await getSession();
  return session.isLoggedIn;
}

export async function listPackages(query?: ListPackagesQuery) {
  const {cachyBuilderClient, session} = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  try {
    const packages = await cachyBuilderClient.listPackages(
      query,
      await headers()
    );
    return packages;
  } catch (error) {
    return {
      error: `Failed to list packages: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function listRebuildPackages() {
  const {cachyBuilderClient, session} = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  try {
    const packages = await cachyBuilderClient.listRebuildPackages(
      await headers()
    );
    return packages;
  } catch (error) {
    return {
      error: `Failed to list packages: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function listRepoActions(query?: ListRepoActionsQuery) {
  const {cachyBuilderClient, session} = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  try {
    const actions = await cachyBuilderClient
      .listRepoActions(query, await headers())
      .then(response => {
        return {
          ...response,
          actions: response.actions.map(action => {
            const parsedPackages = action.packages
              .split(',')
              .map(pkg => ({...action, packages: pkg.trim()}));
            return {
              ...action,
              packages:
                parsedPackages.length > 1
                  ? `${parsedPackages.length} packages`
                  : parsedPackages.shift()!.packages,
              parsedPackages,
            } as ParsedRepoAction;
          }),
        };
      });
    return actions;
  } catch (error) {
    return {
      error: `Failed to list repo actions: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function login(loginRequest: LoginRequest) {
  const data = LoginRequestSchema.safeParse(loginRequest);
  if (!data.success) {
    return {
      error: `Invalid login request: ${data.error.issues.map(issue => issue.message).join(', ')}`,
    };
  }

  const turnstileResponse = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      body: `secret=${encodeURIComponent(process.env.TURNSTILE_SECRET_KEY!)}&response=${encodeURIComponent(data.data.turnstileToken)}`,
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
    }
  )
    .then(res => res.json())
    .then(res => res.success)
    .catch(() => false);

  if (!turnstileResponse) {
    return {
      error: 'Turnstile verification failed. Please try again.',
    };
  }

  const {cachyBuilderClient, session} = await getSession();
  try {
    const {errors, validServers} = await cachyBuilderClient.login(
      data.data,
      await headers(),
      true
    );
    session.isLoggedIn = true;
    session.username = data.data.username;
    session.tokens = cachyBuilderClient.apiTokens;
    session.serverIndex = cachyBuilderClient.serverIdx;
    session.profile_picture_url = '/cachyos-logo.svg';
    await session.save();
    return {
      success: validServers.length > 0,
      warning:
        errors.length > 0
          ? `Some servers failed to respond correctly and have been disabled for this session:\n${errors}`
          : undefined,
    };
  } catch (error) {
    return {
      error: `Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function logout() {
  const {session} = await getSession();
  session.destroy();
  return redirect('/');
}

export async function rebuildPackage(
  pkgbase: string,
  march: PackageMArch,
  repository: PackageRepo
) {
  const {cachyBuilderClient, session} = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  try {
    const response = await cachyBuilderClient.rebuildPackage(
      {march, pkgbase, repository},
      await headers()
    );
    return response;
  } catch (error) {
    return {
      error: `Failed to rebuild package: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function searchPackages(query: SearchPackagesQuery) {
  const {cachyBuilderClient, session} = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  try {
    const packages = await cachyBuilderClient.searchPackages(
      query,
      await headers()
    );
    return packages;
  } catch (error) {
    return {
      error: `Failed to list packages: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function updateProfile(profile: UserProfile, updateAll = false) {
  const {cachyBuilderClient, session} = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  try {
    const {
      errors,
      profile: updatedProfile,
      validServers,
    } = await cachyBuilderClient.updateProfile(
      profile,
      updateAll,
      true,
      await headers()
    );
    session.displayName =
      updatedProfile.display_name ?? updatedProfile.username;
    session.profile_picture_url =
      updatedProfile.profile_picture_url ?? '/cachyos-logo.svg';
    session.username = updatedProfile.username;
    await session.save();
    return {
      profile: updatedProfile,
      success: validServers.length > 0,
      warning:
        errors.length > 0
          ? `Failed to update profile on some servers, you can try again later:\n${errors}`
          : undefined,
    };
  } catch (error) {
    return {
      error: `Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
