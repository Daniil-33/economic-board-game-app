import test from 'node:test';
import assert from 'node:assert/strict';
import { collectSnapshot, sha256, validateSnapshot } from '../review/snapshot.mjs';

const options = {
  repository: 'example/project',
  prNumber: 3,
  policyRevision: 'a'.repeat(40),
  specRevision: 'b'.repeat(40),
  adrRevision: 'c'.repeat(40),
  knowledgeLockDigest: 'd'.repeat(64),
  applicability: 'infrastructure',
};
const meta = {
  repository: options.repository,
  prNumber: 3,
  state: 'open',
  baseSHA: 'e'.repeat(40),
  headSHA: 'f'.repeat(40),
};
const files = [
  {
    filename: 'zeta.txt',
    status: 'modified',
    additions: 1,
    deletions: 0,
    changes: 1,
    patch: '@@ -1 +1 @@',
  },
  { filename: 'alpha.txt', status: 'added', additions: 2, deletions: 0, changes: 2, patch: null },
];

function api(overrides = {}) {
  return {
    getPullRequest: async () => ({ ...meta, ...(overrides.meta ?? {}) }),
    listChangedFiles: async (_repo, _pr, page) =>
      page === 1 ? { items: files, nextPage: null } : { items: [], nextPage: null },
    ...overrides,
  };
}

test('collects a complete sorted snapshot and binds review input to its digest', async () => {
  const result = await collectSnapshot(api(), options);
  assert.deepEqual(
    result.snapshot.files.map((file) => file.filename),
    ['alpha.txt', 'zeta.txt'],
  );
  assert.equal(result.snapshot.diffDigest, sha256(result.snapshot.files));
  assert.equal(result.input.diffDigest, result.snapshot.diffDigest);
  assert.equal(result.input.baseSHA, meta.baseSHA);
});

test('detects movement of base or head during pagination', async () => {
  let calls = 0;
  await assert.rejects(
    () =>
      collectSnapshot(
        api({
          getPullRequest: async () => ({
            ...meta,
            headSHA: calls++ === 0 ? meta.headSHA : '0'.repeat(40),
          }),
        }),
        options,
      ),
    /metadata.changed/,
  );
});

test('requires explicit pagination completion and rejects malformed pages', async () => {
  await assert.rejects(
    () => collectSnapshot(api({ listChangedFiles: async () => ({ items: files }) }), options),
    /files.pagination/,
  );
  await assert.rejects(
    () =>
      collectSnapshot(
        api({ listChangedFiles: async () => ({ items: files, nextPage: 1 }) }),
        options,
      ),
    /files.pagination/,
  );
  await assert.rejects(
    () =>
      collectSnapshot(
        api({
          listChangedFiles: async () => ({
            items: [{ ...files[0], filename: '../secret' }],
            nextPage: null,
          }),
        }),
        options,
      ),
    /file.filename/,
  );
});

test('fails closed on closed PR, duplicate files, excessive patch and digest tampering', async () => {
  await assert.rejects(
    () => collectSnapshot(api({ meta: { state: 'closed' } }), options),
    /metadata.state/,
  );
  await assert.rejects(
    () =>
      collectSnapshot(
        api({ listChangedFiles: async () => ({ items: [files[0], files[0]], nextPage: null }) }),
        options,
      ),
    /files.duplicate/,
  );
  await assert.rejects(
    () =>
      collectSnapshot(
        api({
          listChangedFiles: async () => ({
            items: [{ ...files[0], patch: 'x'.repeat(2_000_001) }],
            nextPage: null,
          }),
        }),
        options,
      ),
    /file.patch/,
  );
  const snapshot = await collectSnapshot(api(), options);
  assert.throws(
    () => validateSnapshot({ ...snapshot.snapshot, diffDigest: '0'.repeat(64) }),
    /diffDigest.value/,
  );
});

test('does not expose adapter values in errors', async () => {
  await assert.rejects(
    () =>
      collectSnapshot(
        api({
          listChangedFiles: async () => ({
            items: [{ ...files[0], filename: '../PRIVATE_CANARY' }],
            nextPage: null,
          }),
        }),
        options,
      ),
    (error) =>
      error.message.startsWith('Invalid PR snapshot:') && !error.message.includes('PRIVATE_CANARY'),
  );
});
