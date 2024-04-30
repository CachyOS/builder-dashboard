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
