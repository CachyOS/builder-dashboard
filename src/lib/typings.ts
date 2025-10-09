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

export const packageMArch = z.enum(
  PackageMArch,
  `Architecture must be one of: ${packageMArchValues.join(', ')}`
);

export enum PackageRepo {
  CORE = 'core',
  EXTRA = 'extra',
}

export const packageRepoValues = Object.values(PackageRepo);

export const packageRepo = z.enum(
  PackageRepo,
  `Repository must be one of: ${packageRepoValues.join(', ')}`
);

export enum AuditLogEventName {
  BULK_QPKG_REBUILD = 'BULK_QPKG_REBUILD',
  QPKG_REBUILD = 'QPKG_REBUILD',
}

export const auditLogEventNameValues = Object.values(AuditLogEventName);

export const auditLogEventName = z.enum(
  AuditLogEventName,
  `Event name must be one of: ${auditLogEventNameValues.join(', ')}`
);

export enum PackageStatsType {
  BUILD_TIME = 'build_time',
  CATEGORY = 'category',
  MONTH = 'month',
}

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

export const packageStatus = z.enum(
  PackageStatus,
  `Status must be one of: ${packageStatusValues.join(', ')}`
);

export enum RepoActionType {
  ADDITION = 'ADDITION',
  REMOVAL = 'REMOVAL',
  UNKNOWN = 'UNKNOWN',
}

export const repoActionTypeValues = Object.values(RepoActionType);

export const repoActionType = z.enum(
  RepoActionType,
  `Action type must be one of: ${repoActionTypeValues.join(', ')}`
);

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
  march: packageMArch,
  pkgbase: z.string(),
  repository: packageRepo,
});

export type BasePackage = z.infer<typeof BasePackageSchema>;

export const BasePackageListSchema = z.array(BasePackageSchema);

export type BasePackageList = z.infer<typeof BasePackageListSchema>;

export const BasePackageWithIDSchema = BasePackageSchema.extend({
  id: z.string(),
});

export type BasePackageWithID = z.infer<typeof BasePackageWithIDSchema>;

export const BasePackageWithIDListSchema = z.array(BasePackageWithIDSchema);

export type BasePackageWithIDList = z.infer<typeof BasePackageWithIDListSchema>;

export const RebuildPackageSchema = BasePackageSchema.extend({
  status: packageStatus,
  updated: z.number('Updated must be a positive integer').nonnegative(),
});

export type RebuildPackage = z.infer<typeof RebuildPackageSchema>;

export const RebuildPackageListSchema = z.array(RebuildPackageSchema);

export type RebuildPackageList = z.infer<typeof RebuildPackageListSchema>;

export const BasePackageWithName = BasePackageSchema.extend({
  pkgname: z.string(),
});

export type BasePackageWithName = z.infer<typeof BasePackageWithName>;

export const BasePackageWithNameListSchema = z.array(BasePackageWithName);

export type BasePackageWithNameList = z.infer<
  typeof BasePackageWithNameListSchema
>;

export const PackageSchema = BasePackageWithName.extend({
  repo_version: z.string(),
  status: packageStatus,
  updated: z.number('Updated must be a positive integer').nonnegative(),
  version: z.string(),
});

export type Package = z.infer<typeof PackageSchema>;

export const PackageListSchema = z.array(PackageSchema);

export type PackageList = z.infer<typeof PackageListSchema>;

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

export const BasePackagesQuerySchema = z.strictObject({
  march_filter: z.array(packageMArch).optional(),
  repo_filter: z.array(packageRepo).optional(),
  status_filter: z.array(packageStatus).optional(),
});

export const SearchPackagesQuerySchema = BasePackagesQuerySchema.extend({
  search: z
    .string()
    .min(1, 'Search query must be at least 1 character long')
    .max(256, 'Search query must be at most 256 characters long'),
});

export type SearchPackagesQuery = z.infer<typeof SearchPackagesQuerySchema>;

export const ListPackagesQuerySchema = BasePackagesQuerySchema.extend({
  current_page: z
    .number('Current page must be a positive integer')
    .nonnegative()
    .default(1)
    .optional(),
  page_size: z
    .number('Page size must be a positive integer')
    .nonnegative()
    .default(20)
    .optional(),
});

export type ListPackagesQuery = z.infer<typeof ListPackagesQuerySchema>;

export const ListPackageResponseSchema = z.strictObject({
  packages: PackageListSchema,
  total_packages: z
    .number('Total packages must be a positive integer')
    .nonnegative(),
  total_pages: z.number('Total pages must be a positive integer').nonnegative(),
});

export type ListPackageResponse = z.infer<typeof ListPackageResponseSchema>;

export const UserProfileSchema = z.strictObject({
  display_desc: z
    .string()
    .max(512, 'Description must be at most 512 characters long')
    .nullable(),
  display_name: z.string().nullable(),
  id: z.string().min(1, 'ID must be at least 1 character long'),
  profile_picture_url: z.string().nullable(),
  updated: z.number('Updated must be an positive integer').nonnegative(),
  username: z
    .string()
    .lowercase('Username must be lowercase')
    .min(1, 'Username must be at least 1 character long'),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

export const NonNullableUserProfileSchema = UserProfileSchema.extend({
  display_desc: z
    .string()
    .max(512, 'Description must be at most 512 characters long'),
  display_name: z.string(),
  profile_picture_url: z.union(
    [
      z.url({
        hostname: z.regexes.domain,
        protocol: /^https?$/,
      }),
      z.literal('/cachyos-logo.svg'),
      z.literal(''),
    ],
    'Profile picture URL must be a valid URL or an empty string'
  ),
});

export type NonNullableUserProfile = z.infer<
  typeof NonNullableUserProfileSchema
>;

export const PackageStatsListSchema = z.array(
  z.object({
    package_count: z.number(),
    status_name: packageStatus,
  })
);

export type PackageStatsList = z.infer<typeof PackageStatsListSchema>;

export const PackageStatsByMonth = z.object({
  package_count: z.number(),
  reporting_month: z
    .number('Reporting month must be an positive integer')
    .nonnegative(),
  status_name: packageStatus,
});

export type PackageStatsByMonth = z.infer<typeof PackageStatsByMonth>;

export const PackageStatsByMonthListSchema = z.array(PackageStatsByMonth);

export type PackageStatsByMonthList = z.infer<
  typeof PackageStatsByMonthListSchema
>;

export const ProcessedPackageStatsByMonth = PackageStatsByMonth.extend({
  reporting_month: z
    .string()
    .min(1, 'Reporting month must be a non-empty string'),
});

export type ProcessedPackageStatsByMonth = z.infer<
  typeof ProcessedPackageStatsByMonth
>;

export const ProcessedPackageStatsByMonthListSchema = z.array(
  ProcessedPackageStatsByMonth
);

export type ProcessedPackageStatsByMonthList = z.infer<
  typeof ProcessedPackageStatsByMonthListSchema
>;

export const RepoActionSchema = z.object({
  action_type: repoActionType,
  march: packageMArch,
  packages: z.string(),
  repository: z.string(),
  status: z.boolean(),
  updated: z.number('Updated must be an positive integer').nonnegative(),
});

export const ParsedRepoActionSchema = RepoActionSchema.extend({
  parsedPackages: z.array(RepoActionSchema),
});

export type ParsedRepoAction = z.infer<typeof ParsedRepoActionSchema>;

export type RepoAction = z.infer<typeof RepoActionSchema>;

export const RepoActionListSchema = z.array(RepoActionSchema);

export type RepoActionList = z.infer<typeof RepoActionListSchema>;

export const ListRepoActionsQuerySchema = z.strictObject({
  current_page: z
    .number('Current page must be a positive integer')
    .nonnegative()
    .default(1)
    .optional(),
  march: z.array(packageMArch).optional(),
  page_size: z
    .number('Page size must be a positive integer')
    .nonnegative()
    .default(50)
    .optional(),
  repo: z.array(packageRepo).optional(),
});

export type ListRepoActionsQuery = z.infer<typeof ListRepoActionsQuerySchema>;

export const RepoActionsResponseSchema = z.strictObject({
  actions: RepoActionListSchema,
  total_actions: z
    .number('Total actions must be a positive integer')
    .nonnegative(),
  total_pages: z.number('Total pages must be a positive integer').nonnegative(),
});

export type RepoActionsResponse = z.infer<typeof RepoActionsResponseSchema>;

export const ParsedRepoActionsResponseSchema = RepoActionsResponseSchema.extend(
  {
    actions: z.array(ParsedRepoActionSchema),
  }
);

export type MonthlyChartData = (Record<PackageStatus, number> & {
  reporting_month: string;
})[];

export const BuildTimeStatsData = z.strictObject({
  average_build_time: z.number(),
  average_max_rss: z.number(),
  average_user_time: z.number(),
  march: packageMArch,
  repository: packageRepo,
});

export type BuildTimeStatsData = z.infer<typeof BuildTimeStatsData>;

export const BuildTimeStatsDataList = z.array(BuildTimeStatsData);

export type BuildTimeStatsDataList = z.infer<typeof BuildTimeStatsDataList>;

export const AuditLogEvent = z.strictObject({
  event_desc: z
    .string()
    .min(1, 'Event description must be at least 1 character long'),
  event_name: auditLogEventName,
  id: z.string().min(1, 'ID must be at least 1 character long'),
  updated: z.number('Updated must be a positive integer').nonnegative(),
  username: z.string().min(1, 'Username must be at least 1 character long'),
});

export type AuditLogEvent = z.infer<typeof AuditLogEvent>;

export const AuditLogListSchema = z.array(AuditLogEvent);

export type AuditLogList = z.infer<typeof AuditLogListSchema>;

export interface ParsedAuditLogEntry {
  description: string;
  id: string;
  updated: number;
  username: string;
}

export interface ParsedAuditLogEntryWithPackages extends ParsedAuditLogEntry {
  eventName: AuditLogEventName;
  packages: ParsedAuditLogEntry[];
}

export type ParsedRepoActionsResponse = z.infer<
  typeof ParsedRepoActionsResponseSchema
>;

export const RebuildPackageResponseSchema = z.strictObject({
  track_id: z.string().trim().nonempty('Track ID must not be empty'),
});

export type RebuildPackageResponse = z.infer<
  typeof RebuildPackageResponseSchema
>;

export const BulkRebuildPackagesResponseSchema = z
  .array(z.string())
  .nonempty('Bulk Rebuild Track IDs array must not be empty');

export type BulkRebuildPackagesResponse = z.infer<
  typeof BulkRebuildPackagesResponseSchema
>;
