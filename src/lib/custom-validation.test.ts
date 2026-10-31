/// <reference types="bun" />
import {describe, expect, test} from 'bun:test';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

import {
  gitUrlError,
  isValidGitUrl,
  isValidPkgbase,
  isValidPkgPath,
} from './custom-validation';

describe('isValidPkgbase', () => {
  test.each(['my-pkg@1.0_x+2', 'a', 'foo.bar', 'A'.repeat(256)])(
    'accepts %p',
    v => expect(isValidPkgbase(v)).toBe(true)
  );

  test.each(['', 'bad name', 'a/b', 'a'.repeat(257), 'péx', 'a\tb'])(
    'rejects %p',
    v => expect(isValidPkgbase(v)).toBe(false)
  );
});

describe('isValidPkgPath', () => {
  test.each(['', 'sub/dir', 'a/b/pkg', 'a/b/c.txt', 'a//b', 'a/'])(
    'accepts %p',
    v => expect(isValidPkgPath(v)).toBe(true)
  );

  test.each([
    '/abs',
    'a/../b',
    './x',
    '../x',
    'a/./b',
    'a b',
    `${'a/'.repeat(129)}`,
  ])('rejects %p', v => expect(isValidPkgPath(v)).toBe(false));
});

const GIT_URL_CASES = readFileSync(
  join(import.meta.dir, 'git_url_cases.txt'),
  'utf8'
)
  .split('\n')
  .filter(line => line.length > 0)
  .map(line => {
    const sep = line.indexOf(' ');
    return sep === -1
      ? {kind: line, url: ''}
      : {kind: line.slice(0, sep), url: line.slice(sep + 1)};
  });

describe('isValidGitUrl', () => {
  test.each(GIT_URL_CASES.filter(c => c.kind === 'allow').map(c => c.url))(
    'accepts %p',
    v => expect(isValidGitUrl(v)).toBe(true)
  );

  test.each(GIT_URL_CASES.filter(c => c.kind === 'deny').map(c => c.url))(
    'rejects %p',
    v => expect(isValidGitUrl(v)).toBe(false)
  );
});

describe('gitUrlError', () => {
  test.each([
    ['http://github.com/CachyOS/repo.git', 'Only https:// URLs are supported'],
    ['https://aur.archlinux.org/yay.git', 'Only github.com is accepted'],
    ['https://github.com/user/repo.git', "'user' is not allowed"],
    ['https://github.com/CachyOS', 'Missing repository name'],
    ['https://github.com/CachyOS/%2e%2e/evil/repo.git', 'Malformed URL'],
    [
      'https://github.com/CachyOS/repo/tree/main/a/b/pkg',
      'Use the repository URL only',
    ],
    [
      'https://github.com/CachyOS/repo/blob/dev/a/b/pkg/PKGBUILD',
      'Use the repository URL only',
    ],
    ['https://github.com/CachyOS/repo.git/a/b', 'Use the repository URL only'],
    [
      'https://github.com/CachyOS/repo/tree/main',
      'Use the repository URL only',
    ],
  ])('%p -> %p', (url, message) => expect(gitUrlError(url)).toBe(message));
});
