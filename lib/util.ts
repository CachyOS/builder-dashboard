import {
  AuditLogEntry,
  AuditLogEventName,
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
    let packages: {
      march: string;
      pkgbase: string;
      repository: string;
    }[] = [];
    const raw_pkgs = new RegExp(/\[.*\]/g).exec(event.event_desc);
    if (raw_pkgs?.length) {
      const [pkgbase, repository, march] = raw_pkgs[0]
        .split("'-'")
        .map(pkg => JSON.parse(pkg));
      packages = pkgbase.map((pkgbase: string, i: number) => ({
        march: march[i],
        pkgbase,
        repository: repository[i],
      }));
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
