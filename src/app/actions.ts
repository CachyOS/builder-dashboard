'use server';

import {getIronSession} from 'iron-session';
import {cookies, headers} from 'next/headers';
import {redirect} from 'next/navigation';

import CachyBuilderClient from '@/lib/CachyBuilderClient';
import {defaultSession, SessionData, sessionOptions} from '@/lib/session';
import {
  ListPackagesQuery,
  ListRepoActionsQuery,
  LoginRequest,
  LoginRequestSchema,
  PackageStatsType,
  SearchPackagesQuery,
} from '@/lib/typings';

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

export async function getPackageStats(
  type: PackageStatsType = PackageStatsType.CATEGORY
) {
  const {cachyBuilderClient, session} = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  try {
    const stats =
      type === 'month'
        ? await cachyBuilderClient.listPackageStatsByMonth(await headers())
        : await cachyBuilderClient.listPackageStatsByCategory(await headers());
    if (type === 'month' && Array.isArray(stats)) {
      return stats.map(stat => ({
        ...stat,
        reporting_month: new Date(stat.reporting_month * 1000)
          .toISOString()
          .slice(0, 7),
      }));
    }
    return stats;
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

export async function getUser() {
  const {cachyBuilderClient, session} = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  const {display_name, profile_picture_url, username} =
    await cachyBuilderClient.getUserProfile(await headers());
  session.displayName = display_name ?? username;
  session.username = username;
  session.profile_picture_url = profile_picture_url ?? '/cachyos-logo.svg';
  await session.save();
  return {
    displayName: session.displayName,
    profile_picture_url: session.profile_picture_url,
    username: session.username,
  };
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
    const actions = await cachyBuilderClient.listRepoActions(
      query,
      await headers()
    );
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
