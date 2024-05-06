'use client';

import {login} from '@/app/actions';
import {Turnstile} from '@marsidev/react-turnstile';
import {TextInput} from '@tremor/react';
import Image from 'next/image';
import {useFormState} from 'react-dom';

import SubmitButton from './SubmitButton';

const initialState = {
  errorCredentials: '',
  errorPassword: '',
  errorUsername: '',
};

export default function LoginForm() {
  const [state, formAction] = useFormState(login, initialState);
  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-4 py-10 lg:px-6">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="flex flex-row justify-center">
          <Image
            alt="CachyOS Logo"
            className="invert dark:invert-0"
            height={128}
            src="/logo.png"
            width={128}
          />
        </div>
        <h3 className="text-center text-tremor-title font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
          Log in to your CachyOS Builder account
        </h3>
        <form action={formAction} className="mt-6">
          <label
            className="text-tremor-default font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong"
            htmlFor="username"
          >
            Username
          </label>
          <TextInput
            autoComplete="username"
            className="mt-2"
            error={!!state?.errorUsername}
            errorMessage={state?.errorUsername}
            id="username"
            maxLength={256}
            name="username"
            placeholder="Your username"
            required
            type="text"
          />
          <label
            className="text-tremor-default font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong"
            htmlFor="password"
          >
            Password
          </label>
          <TextInput
            autoComplete="password"
            className="mt-2"
            error={!!state?.errorPassword}
            errorMessage={state?.errorPassword}
            id="password"
            maxLength={256}
            minLength={8}
            name="password"
            placeholder="********"
            required
            type="password"
          />
          <Turnstile
            className="mt-2 outline-none ring-0"
            options={{theme: 'auto', appearance: 'always'}}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
          />
          <SubmitButton text="Sign in" />
        </form>
        <p className="mt-2 text-red-500 text-center">
          {state.errorCredentials}
        </p>
        <p className="mt-4 text-tremor-label text-tremor-content dark:text-dark-tremor-content">
          By signing in, you agree to data processing and privacy policy. Your
          ip address and user agent will be stored for security purposes.
        </p>
      </div>
    </div>
  );
}
