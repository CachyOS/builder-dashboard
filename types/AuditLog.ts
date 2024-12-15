export enum AuditLogEventName {
  BULK_QPKG_REBUILD = 'BULK_QPKG_REBUILD',
  QPKG_REBUILD = 'QPKG_REBUILD',
}

export interface AuditLogEntry {
  id: string;
  event_desc: string;
  event_name: 'BULK_QPKG_REBUILD' | 'QPKG_REBUILD';
  updated: number;
  username: string;
}

export interface AuditLogPackage {
  march: string;
  pkgbase: string;
  repository: string;
}

export interface AuditLogPackageWithPkgName extends AuditLogPackage {
  pkgname: string;
}

export interface ParsedAuditLogEntry extends AuditLogEntry {
  packages: AuditLogPackage[];
}

export interface DistinctAuditLogUsers {
  users: string[];
}
