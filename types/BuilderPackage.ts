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
}

export interface BuilderPackage {
  march: BuilderPackageArchitecture;
  pkgbase: string;
  pkgname: string;
  repo_version: string;
  repository: BuilderPackageRepository;
  status: BuilderPackageStatus;
  updated: number;
  version: string;
}

export interface BuilderRebuildPackage {
  status: BuilderPackageStatus;
  updated: number;
  march: BuilderPackageArchitecture;
  repository: BuilderPackageRepository;
  pkgbase: string;
}

export interface BuilderPackageWithID extends BuilderPackage {
  packageID: string;
}

export interface BuilderRebuildPackageWithID extends BuilderRebuildPackage {
  packageID: string;
}
