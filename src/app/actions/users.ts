'use server';

import {headers} from 'next/headers';
import {redirect} from 'next/navigation';

import {getSession} from '@/app/actions/session';
import {UserData, UserProfile} from '@/lib/typings';

export async function changeServer(serverName: string) {
  const {session} = await getSession();
  const serverIndex = session.tokens.findIndex(
    token => token.name === serverName && token.token !== ''
  );
  if (serverIndex === -1) {
    return {
      error: `Server "${serverName}" not found or is not accessible with the current session.`,
    };
  }
  session.serverIndex = serverIndex;
  await session.save();
  return {
    msg: `Switched to server "${serverName}" successfully.`,
  };
}

export async function getAccessibleServers() {
  const {session} = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  return session.tokens.map((token, index) => ({
    accessible: token.token !== '',
    active: index === session.serverIndex,
    description: token.description,
    name: token.name,
  }));
}

export async function getLoggedInUser(
  fullProfile: false
): Promise<UserData | {error: string}>;

export async function getLoggedInUser(
  fullProfile: true
): Promise<UserProfile | {error: string}>;

export async function getLoggedInUser(fullProfile = false) {
  const {cachyBuilderClient, session} = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  try {
    const user = await cachyBuilderClient.getLoggedInUserProfile(
      await headers()
    );
    session.displayName = user.display_name ?? user.username;
    session.username = user.username;
    session.profile_picture_url =
      user.profile_picture_url ?? '/cachyos-logo.svg';
    await session.save();
    if (fullProfile) {
      return user;
    }
    return {
      displayName: session.displayName,
      profile_picture_url: session.profile_picture_url,
      username: session.username,
    };
  } catch (error) {
    return {
      error: `Failed to get user profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function getUser(username: string) {
  const {cachyBuilderClient, session} = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  try {
    const user = await cachyBuilderClient.getUserProfile(
      username,
      await headers()
    );
    return user;
  } catch (error) {
    return {
      error: `Failed to get user profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function updateProfile(profile: UserProfile, updateAll = false) {
  const {cachyBuilderClient, session} = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  try {
    const {
      errors,
      profile: updatedProfile,
      validServers,
    } = await cachyBuilderClient.updateProfile(
      profile,
      updateAll,
      true,
      await headers()
    );
    session.displayName =
      updatedProfile.display_name ?? updatedProfile.username;
    session.profile_picture_url =
      updatedProfile.profile_picture_url ?? '/cachyos-logo.svg';
    session.username = updatedProfile.username;
    await session.save();
    return {
      profile: updatedProfile,
      success: validServers.length > 0,
      warning:
        errors.length > 0
          ? `Failed to update profile on some servers, you can try again later:\n${errors}`
          : undefined,
    };
  } catch (error) {
    return {
      error: `Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
