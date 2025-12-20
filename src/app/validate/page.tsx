'use client';

import {useRouter} from 'next/navigation';
import {useEffect, useState} from 'react';

import {syncLoggedInUserScopes} from '@/app/actions/session';
import Loader from '@/components/loader';

export default function Page() {
  const router = useRouter();
  const [status, setStatus] = useState(
    'CachyOS Builder Dashboard is loading...'
  );
  const [doRedirect, setDoRedirect] = useState(false);
  useEffect(() => {
    setStatus('Configuring dashboard with your access scopes...');
    const timeout = setTimeout(() => {
      syncLoggedInUserScopes()
        .then(data => {
          if (data.error) {
            return setStatus(data.error);
          } else if (data.success) {
            if (Array.isArray(data.warning) && data.warning.length) {
              setStatus(
                `Some errors occurred while syncing scopes:\n${data.warning}`
              );
              setDoRedirect(true);
            } else {
              setStatus('Scopes synced successfully. Redirecting...');
              setDoRedirect(true);
            }
          } else {
            setStatus(
              'Unable to configure scopes for your account. Please contact site administrator.'
            );
          }
        })
        .catch(() => {});
    }, 7000);
    return () => {
      clearTimeout(timeout);
    };
  }, [router]);
  useEffect(() => {
    if (doRedirect) {
      const redirectTimeout = setTimeout(() => {
        setDoRedirect(true);
        router.push('/dashboard/package-list');
      }, 1200);
      return () => {
        clearTimeout(redirectTimeout);
      };
    }
  }, [router, doRedirect]);
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Loader animate text={status} />
      </div>
    </div>
  );
}
