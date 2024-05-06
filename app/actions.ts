'use server';

import fetcher from '@/lib/fetcher';
import {SessionData, defaultSession, sessionOptions} from '@/lib/session';
import {
  BuilderPackage,
  BuilderRebuildPackage,
  BuilderPackageArchitecture,
  BuilderPackageRepository,
  BaseBuilderPackage,
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
  }
  return session;
}

export async function logout() {
  const session = await getSession();
  session.destroy();
}

export async function login(_: any, formData: FormData) {
  const session = await getSession();
  const username = formData.get('username')?.toString().trim() ?? '';
  const password = formData.get('password')?.toString() ?? '';
  if (!username || !password) {
    return {
      errorCredentials: 'Missing username or password.',
      errorPassword: 'Password is required.',
      errorUsername: 'Username is required.',
    };
  }
  const res = await fetcher<{token: string}>('/v1/login', '', headers(), {
    body: JSON.stringify({
      password,
      username,
    }),
    method: 'POST',
  }).catch(() => {});
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
  await session.save();
  return redirect('/dashboard');
}

export async function getUsername() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  return session.username;
}

export async function getPackages() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  return fetcher<BuilderPackage[]>(
    '/v1/packages',
    session.token,
    headers()
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
    headers()
  ).catch(() => []);
}

export async function getPackageLog(
  pkg: string,
  march: BuilderPackageArchitecture
) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  return fetcher<string>(
    `/v1/logs/${march}/${pkg}.log`,
    session.token,
    headers(),
    {
      method: 'GET',
    },
    'text'
  )
    .then(text => stripAnsi(text))
    .catch(() => '');
}

export async function addPackage(_: any, formData: FormData) {
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
    }
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

export async function rebuildPackage(_: any, formData: FormData) {
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
    }
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

export async function bulkRebuildPackages(
  packages: BaseBuilderPackage[],
  _: any
) {
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
      method: 'PUT',
      body: JSON.stringify(packages),
    }
  ).catch(() => []);
  return {
    success: !!res.length,
  };
}
