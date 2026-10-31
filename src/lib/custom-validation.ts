export const MAX_PKGBASE_LEN = 256;
export const MAX_PKG_PATH_LEN = 256;

// that client side validation only exist to show the user allowed state,
// instead of failing with server error
export const ALLOWED_GIT_ORIGINS = [
  {host: 'github.com', owner: 'CachyOS'},
  {host: 'github.com', owner: 'Seafoam-Labs'},
  {host: 'github.com', owner: 'ventureoo'},
  {host: 'github.com', owner: 'noctalia-dev'},
] as const;

const PKGBASE_RE = /^[A-Za-z0-9@._+-]+$/;
export function isValidPkgbase(v: string): boolean {
  return v.length > 0 && v.length <= MAX_PKGBASE_LEN && PKGBASE_RE.test(v);
}

const PKG_PATH_RE = /^[A-Za-z0-9._/-]*$/;
export function isValidPkgPath(v: string): boolean {
  if (v.length === 0) return true;
  if (v.length > MAX_PKG_PATH_LEN || v.startsWith('/')) return false;
  if (!PKG_PATH_RE.test(v)) return false;
  return v.split('/').every(seg => seg !== '.' && seg !== '..');
}

const HTTPS_PREFIX = 'https://';
const UNSAFE_PATH_CHARS = '%\\?#';
const ALLOWED_HOSTS: readonly string[] = [
  ...new Set(ALLOWED_GIT_ORIGINS.map(origin => origin.host)),
];

const isUnsafeChar = (ch: string) => {
  const code = ch.charCodeAt(0);
  return code <= 0x20 || code >= 0x7f || UNSAFE_PATH_CHARS.includes(ch);
};

const isBadSegment = (seg: string) => seg === '' || seg === '.' || seg === '..';

export function gitUrlError(v: string): string | undefined {
  if (!v.startsWith(HTTPS_PREFIX)) return 'Only https:// URLs are supported';

  const rest = v.slice(HTTPS_PREFIX.length);
  const slash = rest.indexOf('/');
  const host = slash === -1 ? rest : rest.slice(0, slash);
  if (!ALLOWED_HOSTS.includes(host)) {
    return `Only ${ALLOWED_HOSTS.join(', ')} is accepted`;
  }

  const path = slash === -1 ? '' : rest.slice(slash + 1);
  if ([...path].some(isUnsafeChar)) return 'Malformed URL';

  const [owner = '', repo, ...extra] = path.split('/');
  if (isBadSegment(owner)) return 'Malformed URL';

  const ownerAllowed = ALLOWED_GIT_ORIGINS.some(
    origin =>
      origin.host === host && origin.owner.toLowerCase() === owner.toLowerCase()
  );
  if (!ownerAllowed) {
    return `'${owner}' is not allowed`;
  }

  if (!repo) return 'Missing repository name';
  if (isBadSegment(repo) || extra.some(isBadSegment)) return 'Malformed URL';

  if (extra.length > 0) return 'Use the repository URL only';
  return undefined;
}

export function isValidGitUrl(v: string): boolean {
  return gitUrlError(v) === undefined;
}
