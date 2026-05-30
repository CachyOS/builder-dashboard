'use server';

import {headers} from 'next/headers';
import {redirect} from 'next/navigation';

import {getSession} from '@/app/actions/session';
import {AddMaintainerRequest, SubmitPackageRequest} from '@/lib/typings';

export async function addMaintainer(request: AddMaintainerRequest) {
  const {cachyBuilderClient, session} = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  try {
    return await cachyBuilderClient.maintainers.addMaintainer(
      request,
      await headers()
    );
  } catch (error) {
    return {
      error: `Failed to add maintainer: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function approveSubmission(id: string, note?: string) {
  const {cachyBuilderClient, session} = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  try {
    return await cachyBuilderClient.custom.approveSubmission(
      id,
      note,
      await headers()
    );
  } catch (error) {
    return {
      error: `Failed to approve submission: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function cancelSubmission(id: string) {
  const {cachyBuilderClient, session} = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  try {
    return await cachyBuilderClient.custom.cancelSubmission(
      id,
      await headers()
    );
  } catch (error) {
    return {
      error: `Failed to cancel submission: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function getCustomPackages() {
  const {cachyBuilderClient, session} = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  try {
    return await cachyBuilderClient.custom.getCustomPackages(
      1,
      200,
      await headers()
    );
  } catch (error) {
    return {
      error: `Failed to get custom packages: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function getCustomRepos() {
  const {cachyBuilderClient, session} = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  try {
    return await cachyBuilderClient.custom.getCustomRepos(
      1,
      200,
      await headers()
    );
  } catch (error) {
    return {
      error: `Failed to get custom repos: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function getMaintainers(currentPage = 1, pageSize = 200) {
  const {cachyBuilderClient, session} = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  try {
    return await cachyBuilderClient.maintainers.getMaintainers(
      currentPage,
      pageSize,
      await headers()
    );
  } catch (error) {
    return {
      error: `Failed to get maintainers: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function getPackageSubmissions(status?: string) {
  const {cachyBuilderClient, session} = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  try {
    return await cachyBuilderClient.custom.getPackageSubmissions(
      status,
      1,
      200,
      await headers()
    );
  } catch (error) {
    return {
      error: `Failed to get package submissions: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function queueSubmission(id: string) {
  const {cachyBuilderClient, session} = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  try {
    return await cachyBuilderClient.custom.queueSubmission(id, await headers());
  } catch (error) {
    return {
      error: `Failed to queue submission: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function rejectSubmission(id: string, note?: string) {
  const {cachyBuilderClient, session} = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  try {
    return await cachyBuilderClient.custom.rejectSubmission(
      id,
      note,
      await headers()
    );
  } catch (error) {
    return {
      error: `Failed to reject submission: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function revokeMaintainer(id: string) {
  const {cachyBuilderClient, session} = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  try {
    return await cachyBuilderClient.maintainers.revokeMaintainer(
      id,
      await headers()
    );
  } catch (error) {
    return {
      error: `Failed to revoke maintainer: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function submitPackage(request: SubmitPackageRequest) {
  const {cachyBuilderClient, session} = await getSession();
  if (!session.isLoggedIn) {
    return redirect('/');
  }
  try {
    return await cachyBuilderClient.custom.submitPackage(
      request,
      await headers()
    );
  } catch (error) {
    return {
      error: `Failed to submit package: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
