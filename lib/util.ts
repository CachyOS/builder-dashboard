import {BuilderPackageStatus} from '@/types/BuilderPackage';

export function getColor(status: BuilderPackageStatus) {
  switch (status) {
    case BuilderPackageStatus.FAILED:
      return 'red';
    case BuilderPackageStatus.BUILDING:
      return 'amber';
    case BuilderPackageStatus.QUEUED:
      return 'blue';
    case BuilderPackageStatus.DONE:
    case BuilderPackageStatus.SKIPPED:
    case BuilderPackageStatus.LATEST:
      return 'green';
    case BuilderPackageStatus.UNKNOWN:
    default:
      return 'gray';
  }
}

export function getClassByColor(color: string) {
  switch (color) {
    case 'red':
      return 'bg-red-500';
    case 'amber':
      return 'bg-yellow-500';
    case 'blue':
      return 'bg-blue-500';
    case 'green':
      return 'bg-green-500';
    case 'sky':
      return 'bg-sky-500';
    case 'violet':
      return 'bg-purple-500';
    case 'pink':
      return 'bg-pink-500';
    default:
      return 'bg-gray-500';
  }
}
