import {
  AuditLogEntry,
  AuditLogEventName,
  AuditLogPackageWithPkgName,
  ParsedAuditLogEntry,
} from '@/types/AuditLog';
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

export function parseAuditLogEntry(event: AuditLogEntry): ParsedAuditLogEntry {
  if (event.event_name === AuditLogEventName.QPKG_REBUILD) {
    return {
      ...event,
      packages: [
        {
          march: event.event_desc.split("'")[5],
          pkgbase: event.event_desc.split("'")[1],
          repository: event.event_desc.split("'")[3],
        },
      ],
      updated: event.updated / 1000000,
    };
  } else if (event.event_name === AuditLogEventName.BULK_QPKG_REBUILD) {
    console.log(event);
    let packages: {
      march: string;
      pkgbase: string;
      repository: string;
    }[] = [];
    const raw_pkgs = event.event_desc
      .replace(/'/g, '')
      .replace('bulk rebuild queued: ', '');
    if (raw_pkgs.length) {
      packages = (JSON.parse(raw_pkgs) as AuditLogPackageWithPkgName[]).map(
        x => ({
          march: x.march,
          pkgbase: `${x.pkgbase} (${x.pkgname})`,
          repository: x.repository,
        })
      );
    }
    return {
      ...event,
      packages,
      updated: event.updated / 1000000,
    };
  }
  return {
    ...event,
    packages: [],
    updated: event.updated / 1000000,
  };
}
