import {z} from 'zod/v4';

export enum APIVersion {
  V1 = 'v1',
  V2 = 'v2',
  V3 = 'v3',
}

export enum PackageMArch {
  x86_64_v3 = 'x86-64-v3',
  x86_64_v4 = 'x86-64-v4',
  ZNVER4 = 'znver4',
}

export const packageMArchValues = Object.values(PackageMArch);

export enum PackageRepo {
  CORE = 'core',
  EXTRA = 'extra',
}

export const packageRepoValues = Object.values(PackageRepo);

export enum PackageStatus {
  BUILDING = 'BUILDING',
  DONE = 'DONE',
  FAILED = 'FAILED',
  LATEST = 'LATEST',
  QUEUED = 'QUEUED',
  SKIPPED = 'SKIPPED',
  UNKNOWN = 'UNKNOWN',
}

export const packageStatusValues = Object.values(PackageStatus);

export enum ResponseType {
  JSON = 'json',
  RAW = 'raw',
  TEXT = 'text',
}

export interface ServerData {
  accessible: boolean;
  active: boolean;
  description: string;
  name: string;
}

export interface UserData {
  displayName: string;
  profile_picture_url: string;
  username: string;
}

export const BasePackageSchema = z.object({
  march: z.enum(
    PackageMArch,
    `Architecture must be one of: ${packageMArchValues.join(', ')}`
  ),
  pkgbase: z.string(),
  repository: z.enum(
    PackageRepo,
    `Repository must be one of: ${packageRepoValues.join(', ')}`
  ),
});

export type BasePackage = z.infer<typeof BasePackageSchema>;

export const BasePackageWithName = BasePackageSchema.extend({
  pkgname: z.string(),
});

export type BasePackageWithName = z.infer<typeof BasePackageWithName>;

export const PackageSchema = BasePackageWithName.extend({
  repo_version: z.string(),
  status: z.enum(
    PackageStatus,
    `Status must be one of: ${packageStatusValues.join(', ')}`
  ),
  updated: z.number('Updated must be a positive integer').positive(),
  version: z.string(),
});

export type Package = z.infer<typeof PackageSchema>;

export const RebuildPackageSchema = BasePackageWithName.extend({
  status: z.enum(
    PackageStatus,
    `Status must be one of: ${packageStatusValues.join(', ')}`
  ),
  updated: z.number('Updated must be a positive integer').positive(),
});

export type RebuildPackage = z.infer<typeof RebuildPackageSchema>;

export const GenericErrorResponseSchema = z.strictObject({
  code: z.string().min(3).max(3),
  message: z.string().min(1),
});

export type GenericErrorResponse = z.infer<typeof GenericErrorResponseSchema>;

export const LoginRequestSchema = z.strictObject({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(256, 'Password must be at most 256 characters long'),
  turnstileToken: z.string().min(1, 'Turnstile token is required'),
  username: z
    .string()
    .min(1, 'Username must be at least 1 character long')
    .max(32, 'Username must be at most 32 characters long'),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const LoginResponseSchema = z.strictObject({
  token: z.string().min(1, 'Token must be at least 1 character long'),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const ListPackagesQuerySchema = z
  .strictObject({
    current_page: z
      .number('Current page must be a positive integer')
      .positive()
      .default(1)
      .optional(),
    march_filter: z
      .array(
        z.enum(
          PackageMArch,
          `Architecture filter must be one of: ${packageMArchValues.join(', ')}`
        )
      )
      .optional(),
    page_size: z
      .number('Page size must be a positive integer')
      .positive()
      .default(20)
      .optional(),
    repo_filter: z
      .array(
        z.enum(
          PackageRepo,
          `Repository filter must be one of: ${Object.values(PackageRepo).join(', ')}`
        )
      )
      .optional(),
    status_filter: z
      .array(
        z.enum(
          PackageStatus,
          `Status filter must be one of: ${Object.values(PackageStatus).join(', ')}`
        )
      )
      .optional(),
  })
  .optional();

export type ListPackagesQuery = z.infer<typeof ListPackagesQuerySchema>;

export const ListPackageResponseSchema = z.strictObject({
  packages: z.array(PackageSchema),
  total_packages: z
    .number('Total packages must be a positive integer')
    .positive(),
  total_pages: z.number('Total pages must be a positive integer').positive(),
});

export type ListPackageResponse = z.infer<typeof ListPackageResponseSchema>;

export const UserProfileSchema = z.strictObject({
  display_desc: z.string().nullable(),
  display_name: z.string().nullable(),
  id: z.string().min(1, 'ID must be at least 1 character long'),
  profile_picture_url: z.string().nullable(),
  updated: z.number('Updated must be an positive integer').positive(),
  username: z.string().min(1, 'Username must be at least 1 character long'),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
