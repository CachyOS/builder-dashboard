'use client';
import {zodResolver} from '@hookform/resolvers/zod';
import {Undo2} from 'lucide-react';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {useForm} from 'react-hook-form';
import {toast} from 'sonner';

import {getLoggedInUser, updateProfile} from '@/app/actions';
import Loader from '@/components/loader';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {useSidebar} from '@/components/ui/sidebar';
import {Switch} from '@/components/ui/switch';
import {Textarea} from '@/components/ui/textarea';
import {UsernameHoverCard} from '@/components/username-hover-card';
import {
  NonNullableUserProfile,
  NonNullableUserProfileSchema,
  UserProfile,
} from '@/lib/typings';

export default function AccountPage() {
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
          <UserAccountForm onUserUpdate={onUserUpdate} user={user} />
        ) : (
          <Loader animate text="Loading user profile..." />
        )}
      </div>
    </Card>
  );
}

function UserAccountForm({
  onUserUpdate,
  user,
}: Readonly<{onUserUpdate: (user: UserProfile) => void; user: UserProfile}>) {
  const [error, setError] = useState<null | string>(null);
  const [warning, setWarning] = useState<null | string>(null);
  const [submitting, setSubmitting] = useState(false);
  const [updateAllServers, setUpdateAllServers] = useState(true);
  const fallbackName = useMemo(
    () =>
      user.username
        .split(' ')
        .map(n => n.charAt(0))
        .join('')
        .toUpperCase(),
    [user]
  );
  const profileImage = useMemo(
    () => user.profile_picture_url ?? '/cachyos-logo.svg',
    [user]
  );
  const form = useForm<NonNullableUserProfile>({
    defaultValues: {
      display_desc: user.display_desc ?? '',
      display_name: user.display_name ?? user.username,
      id: user.id,
      profile_picture_url: user.profile_picture_url ?? '/cachyos-logo.svg',
      updated: user.updated ?? Date.now(),
      username: user.username,
    },
    resolver: zodResolver(NonNullableUserProfileSchema),
  });

  const onSubmit = useCallback(
    (data: NonNullableUserProfile) => {
      if (submitting) {
        return;
      }
      setSubmitting(true);
      setError(null);
      setWarning(null);
      const toastId = toast.loading('Updating profile...');
      updateProfile(data, updateAllServers)
        .then(res => {
          if (res.error) {
            setError(res.error);
            toast.error('Failed to update profile', {
              closeButton: true,
              duration: Infinity,
              id: toastId,
            });
          } else if (res.warning) {
            setWarning(res.warning);
            toast.warning(
              'Failed to update profile on some servers, you can try again later.',
              {
                closeButton: true,
                duration: Infinity,
                id: toastId,
              }
            );
          } else {
            toast.success('Profile updated successfully!', {id: toastId});
          }
          if (res.profile) {
            onUserUpdate(res.profile);
          }
        })
        .catch(() => {
          setError('An unexpected error occurred while updating profile.');
          toast.error('An unexpected error occurred while updating profile.', {
            closeButton: true,
            duration: Infinity,
            id: toastId,
          });
        })
        .finally(() => {
          setSubmitting(false);
        });
    },
    [submitting, onUserUpdate, updateAllServers]
  );

  return (
    <div className="flex flex-col gap-6">
      <Card className="relative overflow-hidden">
        <CardHeader>
          <Avatar className="size-32 rounded-lg mx-auto mb-2 bg-muted p-2">
            <AvatarImage
              alt={user.username}
              {...(profileImage ? {src: profileImage} : {})}
            />
            <AvatarFallback className="rounded-lg text-7xl">
              {fallbackName}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-center decoration-dotted underline">
            <UsernameHoverCard
              description={user.display_desc}
              displayName={user.display_name}
              profileImage={user.profile_picture_url}
              username={user.username}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-3">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({field}) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-3">
                  <FormField
                    control={form.control}
                    name="display_name"
                    render={({field}) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-3">
                  <FormField
                    control={form.control}
                    name="display_desc"
                    render={({field}) => (
                      <FormItem>
                        <FormLabel>Profile Description</FormLabel>
                        <FormControl>
                          <Textarea
                            className="resize-none"
                            placeholder="Tell us a little bit about yourself!"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-3">
                  <FormField
                    control={form.control}
                    name="profile_picture_url"
                    render={({field}) => (
                      <FormItem>
                        <FormLabel>Profile Picture URL</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input {...field} />
                            <Button
                              onClick={() =>
                                field.onChange('/cachyos-logo.svg')
                              }
                              size="icon"
                              type="button"
                              variant="outline"
                            >
                              <Undo2 />
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {error && (
                  <div className="mt-4 text-center text-sm text-destructive whitespace-pre-line">
                    {error}
                  </div>
                )}
                {warning && (
                  <div className="mt-4 text-center text-sm text-amber-400 whitespace-pre-line">
                    {warning}
                  </div>
                )}
                <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <Label htmlFor="update-all-servers">
                      Sync Profile Updates
                    </Label>
                    <p className="text-muted-foreground text-sm">
                      Update your profile on all active servers.
                    </p>
                  </div>
                  <Switch
                    checked={updateAllServers}
                    id="update-all-servers"
                    onCheckedChange={setUpdateAllServers}
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <Button
                    className="w-full"
                    disabled={submitting}
                    type="submit"
                  >
                    {submitting ? 'Updating Profile...' : 'Update Profile'}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
