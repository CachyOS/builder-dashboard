import {AuditLogEventName, ParsedAuditLogEntry} from '@/types/AuditLog';
import {
  BuilderPackageArchitecture,
  BuilderPackageRepository,
  BuilderPackageStatus,
  BuilderPackageWithID,
} from '@/types/BuilderPackage';
import {
  RxCollection,
  RxDatabase,
  addRxPlugin,
  createRxDatabase,
  toTypedRxJsonSchema,
} from 'rxdb';
import {wrappedKeyCompressionStorage} from 'rxdb/plugins/key-compression';
import {RxDBLocalDocumentsPlugin} from 'rxdb/plugins/local-documents';
import {RxDBQueryBuilderPlugin} from 'rxdb/plugins/query-builder';
import {getRxStorageMemory} from 'rxdb/plugins/storage-memory';

const BuilderPackageSchema = toTypedRxJsonSchema({
  indexes: ['pkgbase', 'pkgname', 'repository', 'status'],
  keyCompression: true,
  primaryKey: {
    fields: ['pkgbase', 'pkgname', 'repository', 'march'],
    key: 'packageID',
    separator: '-',
  },
  properties: {
    march: {
      enum: Object.values(BuilderPackageArchitecture),
      maxLength: 10,
      type: 'string',
    },
    packageID: {
      maxLength: 640,
      type: 'string',
    },
    pkgbase: {
      maxLength: 256,
      type: 'string',
    },
    pkgname: {
      maxLength: 256,
      type: 'string',
    },
    repo_version: {
      type: 'string',
    },
    repository: {
      enum: Object.values(BuilderPackageRepository),
      maxLength: 10,
      type: 'string',
    },
    status: {
      enum: Object.values(BuilderPackageStatus),
      maxLength: 10,
      type: 'string',
    },
    updated: {
      type: 'number',
    },
    version: {
      type: 'string',
    },
  },
  required: [
    'march',
    'packageID',
    'pkgbase',
    'pkgname',
    'repo_version',
    'repository',
    'status',
    'updated',
    'version',
  ],
  title: 'packages',
  type: 'object',
  version: 0,
});

const BuilderRebuildPackageSchema = toTypedRxJsonSchema({
  indexes: ['pkgbase', 'march', 'repository', 'status'],
  keyCompression: true,
  primaryKey: {
    fields: ['pkgbase', 'repository', 'march'],
    key: 'packageID',
    separator: '-',
  },
  properties: {
    march: {
      enum: Object.values(BuilderPackageArchitecture),
      maxLength: 10,
      type: 'string',
    },
    packageID: {
      maxLength: 640,
      type: 'string',
    },
    pkgbase: {
      maxLength: 256,
      type: 'string',
    },
    repository: {
      enum: Object.values(BuilderPackageRepository),
      maxLength: 10,
      type: 'string',
    },
    status: {
      enum: Object.values(BuilderPackageStatus),
      maxLength: 10,
      type: 'string',
    },
    updated: {
      type: 'number',
    },
  },
  required: [
    'march',
    'packageID',
    'pkgbase',
    'repository',
    'status',
    'updated',
  ],
  title: 'rebuildPackages',
  type: 'object',
  version: 0,
});

const ParsedAuditLogSchema = toTypedRxJsonSchema({
  indexes: ['updated', 'username', 'event_name'],
  keyCompression: true,
  primaryKey: 'id',
  properties: {
    id: {
      maxLength: 320,
      type: 'string',
    },
    event_desc: {
      type: 'string',
    },
    event_name: {
      enum: Object.values(AuditLogEventName),
      maxLength: 32,
      type: 'string',
    },
    packages: {
      items: {
        properties: {
          march: {
            enum: Object.values(BuilderPackageArchitecture),
            maxLength: 10,
            type: 'string',
          },
          pkgbase: {
            maxLength: 256,
            type: 'string',
          },
          repository: {
            enum: Object.values(BuilderPackageRepository),
            maxLength: 10,
            type: 'string',
          },
        },
        required: ['march', 'pkgbase', 'repository'],
        type: 'object',
      },
      type: 'array',
    },
    updated: {
      maximum: Number.MAX_SAFE_INTEGER,
      minimum: 0,
      multipleOf: 1,
      type: 'number',
    },
    username: {
      maxLength: 256,
      type: 'string',
    },
  },
  required: ['id', 'event_desc', 'event_name', 'packages', 'updated'],
  title: 'auditLogs',
  type: 'object',
  version: 0,
});

export type BuilderPackageCollection = RxCollection<BuilderPackageWithID>;
export type BuilderRebuildPackageCollection =
  RxCollection<BuilderPackageWithID>;
export type ParsedAuditLogCollection = RxCollection<ParsedAuditLogEntry>;
export type BuilderPackageDatabase = RxDatabase<{
  // camelCase is not compatible with RxDB for database and collection names
  audit_logs: ParsedAuditLogCollection;
  packages: BuilderPackageCollection;
  // camelCase is not compatible with RxDB for database and collection names
  rebuild_packages: BuilderRebuildPackageCollection;
}>;

export async function getRxDB() {
  if (process.env.NODE_ENV !== 'production') {
    await import('rxdb/plugins/dev-mode').then(module =>
      addRxPlugin(module.RxDBDevModePlugin)
    );
  }
  addRxPlugin(RxDBQueryBuilderPlugin);
  addRxPlugin(RxDBLocalDocumentsPlugin);
  const db: BuilderPackageDatabase = await createRxDatabase({
    eventReduce: true,
    ignoreDuplicate: process.env.NODE_ENV !== 'production',
    multiInstance: false,
    name: 'packages',
    storage: wrappedKeyCompressionStorage({
      storage: getRxStorageMemory(),
    }),
  });
  await db.addCollections({
    // camelCase is not compatible with RxDB for database and collection names
    audit_logs: {
      schema: ParsedAuditLogSchema,
      localDocuments: true,
    },
    packages: {
      schema: BuilderPackageSchema,
    },
    // camelCase is not compatible with RxDB for database and collection names
    rebuild_packages: {
      schema: BuilderRebuildPackageSchema,
    },
  });
  return db;
}
