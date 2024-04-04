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

export type BuilderPackageCollection = RxCollection<BuilderPackageWithID>;
export type BuilderPackageDatabase = RxDatabase<{
  packages: BuilderPackageCollection;
}>;

export async function getRxDB() {
  if (process.env.NODE_ENV !== 'production') {
    await import('rxdb/plugins/dev-mode').then(module =>
      addRxPlugin(module.RxDBDevModePlugin)
    );
  }
  addRxPlugin(RxDBQueryBuilderPlugin);
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
    packages: {
      schema: BuilderPackageSchema,
    },
  });
  return db;
}

export async function searchPackages(pkg: string) {
  const db = await getRxDB();
  return db.packages.find({
    selector: {
      pkgname: {
        $options: 'ig',
        $regex: pkg,
      },
    },
  });
}
