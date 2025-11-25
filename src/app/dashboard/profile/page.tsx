'use client';
import {useCallback, useEffect, useState} from 'react';
import {toast} from 'sonner';

import {getLoggedInUser} from '@/app/actions/users';
import Loader from '@/components/loader';
import {Card} from '@/components/ui/card';
import {useSidebar} from '@/components/ui/sidebar';
import {UserProfileForm} from '@/components/user-profile-form';
import {UserProfile} from '@/lib/typings';

export default function UserProfilePage() {
  const {activeServer, doRefresh} = useSidebar();
  const [user, setUser] = useState<null | UserProfile>(null);
  const onUserUpdate = useCallback(
    (updatedUser: UserProfile) => {
      setUser(updatedUser);
      doRefresh();
    },
    [doRefresh]
  );
  useEffect(() => {
    setUser(null);
    getLoggedInUser(true).then(data => {
      if ('error' in data) {
        toast.error(data.error, {
          closeButton: true,
          duration: Infinity,
        });
      } else {
        setUser(data);
      }
    });
  }, [activeServer]);
  return (
    <Card className="flex min-h-full w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-lg">
        {user ? (
          <UserProfileForm onUserUpdate={onUserUpdate} user={user} />
        ) : (
          <Loader animate text="Loading user profile..." />
        )}
      </div>
    </Card>
  );
}
