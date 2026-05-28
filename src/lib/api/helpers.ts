import {ReadonlyHeaders} from 'next/dist/server/web/spec-extension/adapters/headers';
import {z} from 'zod/v4';

import {APIVersion, UserScope} from '@/lib/typings';
import {checkScopes} from '@/lib/utils';

import {BaseClient, HttpError} from './base';

/**
 * Fallback policy for read endpoints:
 *  - HTTP 404 is treated as "empty" everywhere: the resource simply doesn't exist
 *    yet while the endpoint itself is correct. Use `emptyOn404` for single-resource
 *    / stats reads so a 404 yields the typed empty value instead of throwing.
 *  - Paginated / list-style reads degrade on any error (network / 5xx / 404) to a
 *    typed empty value.
 *  - Single-resource reads that have no valid empty representation propagate errors.
 *  - Mutations keep their own per-call fallback and rely on `parseOrThrow` to reject
 *    unexpected payloads.
 */

export function buildQuery(
  params: Record<string, number | string | string[] | undefined>
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      if (value.length) search.set(key, value.join(','));
    } else {
      search.set(key, String(value));
    }
  }
  return search.toString();
}

export async function emptyOn404<T>(
  fn: () => Promise<T>,
  empty: T
): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) {
      return empty;
    }
    throw e;
  }
}

/**
 * Fans a single request out to multiple servers, parses each response, aggregates
 * per-server error messages, and applies the `allowInvalid` warn/throw policy.
 * Callers keep their own side effects (token assignment, scope merging, picking a
 * fallback server) since those differ per call.
 */
export async function multiServerCall<T>(opts: {
  allowInvalid: boolean;
  base: BaseClient;
  clientHeaders: Headers | ReadonlyHeaders;
  fallback: unknown;
  isFailure?: (result: z.ZodSafeParseResult<T>) => boolean;
  label: string;
  request: {endpoint: string; init?: RequestInit; version?: APIVersion};
  schema: z.ZodType<T>;
  targets: {name: string; token?: string; url: string}[];
}): Promise<{
  errors: string;
  failedCount: number;
  results: z.ZodSafeParseResult<T>[];
}> {
  const {
    allowInvalid,
    base,
    clientHeaders,
    fallback,
    isFailure = result => !result.success,
    label,
    request,
    schema,
    targets,
  } = opts;

  const responses = await Promise.all(
    targets.map(target =>
      base
        ._fetcher<unknown>({
          authToken: target.token,
          baseURL: target.url,
          clientHeaders,
          endpoint: request.endpoint,
          init: request.init,
          version: request.version ?? APIVersion.V1,
        })
        .catch(() => fallback)
    )
  );

  const results = responses.map(r => schema.safeParse(r));

  const errors = results
    .map((result, i) =>
      result.success
        ? undefined
        : `Server: ${targets[i].name} ${result.error.issues.map(issue => issue.message).join(', ')}`
    )
    .filter((x): x is string => !!x)
    .join('\n');

  const failedCount = results.filter(isFailure).length;

  if (failedCount > 0) {
    if (allowInvalid && failedCount !== targets.length) {
      console.warn(
        `[${label}] Some servers failed to respond correctly, but continuing due to allowInvalid flag.\n${errors}`
      );
    } else {
      throw new Error(`Invalid response from server(s):\n${errors}`);
    }
  }

  return {errors, failedCount, results};
}

/**
 * Validates `value` against `schema`, throwing a uniform error on failure.
 * `label` should carry the full noun, e.g. "package list response" or
 * "add maintainer request".
 */
export function parseOrThrow<T>(
  schema: z.ZodType<T>,
  value: unknown,
  label: string
): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new Error(
      `Invalid ${label}: ${result.error.issues.map(i => i.message).join(', ')}`
    );
  }
  return result.data;
}

export function requireScopes(
  scopes: UserScope[],
  required: UserScope[],
  action: string
): void {
  if (!checkScopes(scopes, required)) {
    throw new Error(
      `You are not authorized to ${action}. Required scopes: ${required.join(', ')}; Got: ${scopes.join(', ')}`
    );
  }
}
