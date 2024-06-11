'use server';

import fetcher from '@/lib/fetcher';
import servers from '@/lib/servers';
import {SessionData, defaultSession, sessionOptions} from '@/lib/session';
import {
  BaseBuilderPackage,
  BuilderPackage,
  BuilderPackageArchitecture,
  BuilderPackageRepository,
  BuilderRebuildPackage,
} from '@/types/BuilderPackage';
import {getIronSession} from 'iron-session';
import {cookies, headers} from 'next/headers';
import {redirect} from 'next/navigation';
import stripAnsi from 'strip-ansi';
import {isURL} from 'validator';

export async function getSession() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  if (!session.isLoggedIn) {
    session.isLoggedIn = defaultSession.isLoggedIn;
    session.token = defaultSession.token;
    session.createdAt = Date.now();
    session.server = defaultSession.server;
  }
  return session;
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  return redirect('/');
}

export async function login(_: unknown, formData: FormData) {
  const session = await getSession();
  const token = formData.get('cf-turnstile-response')?.toString() ?? '';
  const username = formData.get('username')?.toString().trim() ?? '';
  const password = formData.get('password')?.toString() ?? '';
  const redirectTo = formData.get('redirect')?.toString() ?? '';
  const server = formData.get('server')?.toString() ?? defaultSession.server;

  if (!token) {
    return {
      errorCredentials: 'CF Turnstile verification failed. Please try again.',
      errorPassword: '',
      errorUsername: '',
    };
  }

  if (!servers.find(s => s.url === server)) {
    return {
      errorCredentials: 'Invalid server.',
      errorPassword: '',
      errorUsername: '',
    };
  }

  if (!username || !password) {
    return {
      errorCredentials: 'Missing username or password.',
      errorPassword: 'Password is required.',
      errorUsername: 'Username is required.',
    };
  }

  const turnstileResponse = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      body: `secret=${encodeURIComponent(process.env.TURNSTILE_SECRET_KEY!)}&response=${encodeURIComponent(token)}`,
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
      errorCredentials: 'CF Turnstile verification failed. Please try again.',
      errorPassword: '',
      errorUsername: '',
    };
  }

  const res = await fetcher<{token: string}>(
    '/v1/login',
    '',
    headers(),
    {
      body: JSON.stringify({
        password,
        username,
      }),
      method: 'POST',
    },
    server
  ).catch(() => {});
  if (!res?.token) {
    return {
      errorCredentials: 'Invalid username or password.',
      errorPassword: '',
      errorUsername: '',
    };
  }
  session.isLoggedIn = true;
  session.token = res.token;
  session.createdAt = Date.now();
  session.username = username;
  session.server = server;
  await session.save();
  if (redirectTo?.startsWith('/')) {
    return redirect(redirectTo);
  }
  return redirect('/dashboard');
}

export async function getUsername() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  return session.username;
}

export async function getServerDetails() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  return servers.find(s => s.url === session.server)!;
}

export async function getPackages() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  return fetcher<BuilderPackage[]>(
    '/v1/packages',
    session.token,
    headers(),
    {},
    session.server
  ).catch(() => []);
}

export async function getRebuildPackages() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  return fetcher<BuilderRebuildPackage[]>(
    '/v1/rebuild-status',
    session.token,
    headers(),
    {},
    session.server
  ).catch(() => []);
}

export async function getPackageLog(
  pkg: string,
  march: BuilderPackageArchitecture,
  strip = false,
  redirectTo?: string
) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    if (redirectTo?.startsWith('/')) {
      return redirect(`/?redirect=${encodeURIComponent(redirectTo)}`);
    }
    return redirect('/');
  }
  return fetcher<string>(
    `/v1/logs/${march}/${pkg}.log`,
    session.token,
    headers(),
    {
      method: 'GET',
    },
    session.server,
    'text'
  )
    .then(text => (strip ? stripAnsi(text) : text))
    .catch(() => '');
}

export async function addPackage(_: unknown, formData: FormData) {
  const session = await getSession();
  const pkgURL = formData.get('pkgURL')?.toString().trim() ?? '';
  if (!pkgURL || !isURL(pkgURL)) {
    return {
      errorPkgURL: 'Invalid package URL.',
      success: false,
    };
  }
  const res = await fetcher<{success: boolean}>(
    '/v1/packages',
    session.token,
    headers(),
    {
      body: JSON.stringify({
        url: pkgURL,
      }),
      method: 'POST',
    },
    session.server
  ).catch(() => {});
  if (!res?.success) {
    return {
      errorPkgURL: 'Invalid package URL.',
      success: false,
    };
  }
  return {
    errorPkgURL: '',
    success: true,
  };
}

export async function rebuildPackage(_: unknown, formData: FormData) {
  const session = await getSession();
  const march = formData.get('march')?.toString().trim() ?? '';
  const repository = formData.get('repository')?.toString().trim() ?? '';
  const pkgbase = formData.get('pkgbase')?.toString().trim() ?? '';
  if (
    !march ||
    !repository ||
    !pkgbase ||
    !Object.values(BuilderPackageArchitecture).includes(
      march as BuilderPackageArchitecture
    ) ||
    !Object.values(BuilderPackageRepository).includes(
      repository as BuilderPackageRepository
    )
  ) {
    return redirect('/dashboard');
  }
  const res = await fetcher<{track_id: string}>(
    `/v1/rebuild/${march}/${repository}/${pkgbase}`,
    session.token,
    headers(),
    {
      method: 'PUT',
    },
    session.server
  ).catch(() => {});
  if (!res?.track_id) {
    return {
      success: false,
    };
  }
  return {
    success: true,
  };
}

export async function bulkRebuildPackages(packages: BaseBuilderPackage[]) {
  const session = await getSession();
  if (!Array.isArray(packages) || !packages.length) {
    return {
      success: false,
    };
  }
  const res = await fetcher<string[]>(
    '/v1/bulk-rebuild',
    session.token,
    headers(),
    {
      body: JSON.stringify(packages),
      method: 'PUT',
    },
    session.server
  ).catch(() => []);
  return {
    success: !!res.length,
  };
}
