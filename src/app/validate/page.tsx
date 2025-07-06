'use client';

import {useRouter} from 'next/navigation';
import {useEffect} from 'react';

import Loader from '@/components/loader';

export default function Page() {
  const router = useRouter();
  useEffect(() => {
    setTimeout(() => {
      router.push('/dashboard/package-list');
    }, 5000);
  }, [router]);
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Loader animate text="CachyOS Builder Dashboard is loading..." />
      </div>
    </div>
  );
}
