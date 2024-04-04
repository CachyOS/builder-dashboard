'use server';

import fetcher from '@/lib/fetcher';
import {SessionData, defaultSession, sessionOptions} from '@/lib/session';
import {
  BuilderPackage,
  BuilderPackageArchitecture,
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
  const res = await fetcher<BuilderPackage[]>(
    '/v1/packages',
    session.token,
    headers()
  ).catch(() => {});
  if (!res || !Array.isArray(res)) {
    return [];
  }
  return res;
}

export async function getPackageLog(
  pkg: string,
  march: BuilderPackageArchitecture
) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  const clientHeaders = headers();
  return fetch(
    `${process.env.CACHY_BUILDER_API_BASE_URL}/v1/logs/${march}/${pkg}.log`,
    {
      headers: {
        Authorization: `Bearer ${session.token}`,
        'User-Agent':
          clientHeaders.get('User-Agent') ??
          'CachyBuilderDashboardProxyServer/1.0.0',
        'X-Forwarded-For':
          clientHeaders.get('CF-Connecting-IP') ??
          clientHeaders.get('X-Forwarded-For') ??
          '',
      },
      method: 'GET',
    }
  )
    .then(res => res.text())
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
    `${process.env.CACHY_BUILDER_API_BASE_URL}/v1/packages`,
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
  const pkgname = formData.get('pkgname')?.toString().trim() ?? '';
  const march = formData.get('march')?.toString().trim() ?? '';
  if (
    !pkgname ||
    !march ||
    !Object.values(BuilderPackageArchitecture).includes(
      march as BuilderPackageArchitecture
    )
  ) {
    return redirect('/dashboard');
  }
  const res = await fetcher<{success: boolean}>(
    `${process.env.CACHY_BUILDER_API_BASE_URL}/v1/packages`,
    session.token,
    headers(),
    {
      body: JSON.stringify({
        march,
        pkgname,
      }),
      method: 'PUT',
    }
  ).catch(() => {});
  if (!res?.success) {
    return {
      success: false,
    };
  }
  return {
    success: true,
  };
}
