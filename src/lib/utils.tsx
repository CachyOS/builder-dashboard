import {
  IconAlertCircleFilled,
  IconCircleCheckFilled,
  IconCircleChevronsRightFilled,
  IconCircleDashedMinus,
  IconCircleDashedPlus,
  IconLoader,
  IconProgressHelp,
} from '@tabler/icons-react';
import {type ClassValue, clsx} from 'clsx';
import {twMerge} from 'tailwind-merge';

import {PackageStatus, RepoActionType} from '@/lib/typings';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function packageStatusToIcon(status: PackageStatus) {
  switch (status) {
    case PackageStatus.BUILDING:
      return <IconLoader className="size-5" />;
    case PackageStatus.DONE:
      return <IconCircleCheckFilled className="fill-green-500 size-5" />;
    case PackageStatus.FAILED:
      return <IconAlertCircleFilled className="fill-red-500 size-5" />;
    case PackageStatus.LATEST:
      return <IconCircleCheckFilled className="fill-green-500 size-5" />;
    case PackageStatus.QUEUED:
      return <IconLoader className="size-5" />;
    case PackageStatus.SKIPPED:
      return (
        <IconCircleChevronsRightFilled className="fill-yellow-500 size-5" />
      );
    default:
      return (
        <IconProgressHelp className="fill-gray-500 size-5 stroke-gray-50" />
      );
  }
}

export function repoActionTypeToIcon(actionType: RepoActionType) {
  switch (actionType) {
    case RepoActionType.ADDITION:
      return <IconCircleDashedPlus className="stroke-green-500 size-5" />;
    case RepoActionType.REMOVAL:
      return <IconCircleDashedMinus className="stroke-red-500 size-5" />;
    default:
      return (
        <IconProgressHelp className="fill-gray-500 size-5 stroke-gray-50" />
      );
  }
}
