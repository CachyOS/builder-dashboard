import {SessionOptions} from 'iron-session';

import {defaultServer} from './servers';

export type SessionData = {
  createdAt: number;
  isLoggedIn: boolean;
  token: string;
  username: string;
  server: string;
};

export const sessionOptions: SessionOptions = {
  cookieName: 'CACHY_BUILDER_SESSION',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
  password: `${process.env.COOKIE_SECRET}`,
  /**
   * Expire the session after 358 minutes (5 hours and 58 minutes)
   * the cookie will expire after 357 minutes (5 hours and 57 minutes)
   * but the session will be destroyed after 358 minutes (5 hours and 58 minutes).
   */
  ttl: 21480,
};

export const defaultSession: SessionData = {
  createdAt: Date.now(),
  isLoggedIn: false,
  token: '',
  username: '',
  server: defaultServer.url,
};
