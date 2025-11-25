'use client';
import {useParams} from 'next/navigation';
import {useEffect, useState} from 'react';
import {toast} from 'sonner';

import {getUser} from '@/app/actions/users';
import Loader from '@/components/loader';
import {Card} from '@/components/ui/card';
import {useSidebar} from '@/components/ui/sidebar';
import {UserProfileForm} from '@/components/user-profile-form';
import {UserProfile} from '@/lib/typings';

export default function UserProfilePage() {
  const {username} = useParams<{username: string}>();
  const {activeServer} = useSidebar();
  const [user, setUser] = useState<null | UserProfile>(null);
  useEffect(() => {
    if (!username) {
      return;
    }
    setUser(null);
    getUser(username).then(data => {
      if ('error' in data) {
        toast.error(data.error, {
          closeButton: true,
          duration: Infinity,
        });
      } else {
        setUser(data);
      }
    });
  }, [activeServer, username]);
  return (
    <Card className="flex min-h-full w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-lg">
        {user ? (
          <UserProfileForm disabled onUserUpdate={() => {}} user={user} />
        ) : (
          <Loader animate text="Loading user profile..." />
        )}
      </div>
    </Card>
  );
}
