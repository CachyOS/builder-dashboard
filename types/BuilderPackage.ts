export enum BuilderPackageStatus {
  BUILDING = 'BUILDING',
  DONE = 'DONE',
  FAILED = 'FAILED',
  LATEST = 'LATEST',
  QUEUED = 'QUEUED',
  SKIPPED = 'SKIPPED',
  UNKNOWN = 'UNKNOWN',
}

export enum BuilderPackageRepository {
  CORE = 'core',
  EXTRA = 'extra',
}

export enum BuilderPackageArchitecture {
  x86_64_v3 = 'x86-64-v3',
  x86_64_v4 = 'x86-64-v4',
  ZNVER4 = 'znver4',
}

export interface BaseBuilderPackage {
  march: BuilderPackageArchitecture;
  pkgbase: string;
  repository: BuilderPackageRepository;
}

export interface BaseBuilderPackageWithName extends BaseBuilderPackage {
  pkgname: string;
}
export interface BuilderPackage extends BaseBuilderPackageWithName {
  repo_version: string;
  status: BuilderPackageStatus;
  updated: number;
  version: string;
}

export interface BuilderRebuildPackage extends BaseBuilderPackage {
  status: BuilderPackageStatus;
  updated: number;
}

export interface BuilderPackageWithID extends BuilderPackage {
  packageID: string;
}

export interface BuilderRebuildPackageWithID extends BuilderRebuildPackage {
  packageID: string;
}
