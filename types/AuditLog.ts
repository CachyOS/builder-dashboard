export enum AuditLogEventName {
  BULK_QPKG_REBUILD = 'BULK_QPKG_REBUILD',
  QPKG_REBUILD = 'QPKG_REBUILD',
}

export interface AuditLogEntry {
  event_desc: string;
  event_name: 'BULK_QPKG_REBUILD' | 'QPKG_REBUILD';
  updated: number;
  username: string;
}

export interface ParsedAuditLogEntry extends AuditLogEntry {
  packages: {
    march: string;
    pkgbase: string;
    repository: string;
  }[];
}

export interface ParsedAuditLogWithID extends ParsedAuditLogEntry {
  auditLogID: string;
}

export interface DistinctAuditLogUsers {
  users: string[];
}
