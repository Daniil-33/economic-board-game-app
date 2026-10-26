import { createHash } from 'node:crypto';
import { validateReviewInput } from './contracts.mjs';

const SHA = /^[a-f0-9]{40}$/;
const DIGEST = /^[a-f0-9]{64}$/;
const MAX_FILES = 2000;
const MAX_PATCH_BYTES = 2_000_000;

function fail(field) {
  throw new Error('Invalid PR snapshot: ' + field);
}
function required(condition, field) {
  if (!condition) fail(field);
}

function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') {
    return (
      '{' +
      Object.keys(value)
        .sort()
        .map((key) => JSON.stringify(key) + ':' + canonical(value[key]))
        .join(',') +
      '}'
    );
  }
  return JSON.stringify(value);
}

export function sha256(value) {
  return createHash('sha256')
    .update(typeof value === 'string' ? value : canonical(value), 'utf8')
    .digest('hex');
}

function normalizeFile(file) {
  required(file && typeof file === 'object' && !Array.isArray(file), 'file');
  required(
    typeof file.filename === 'string' && file.filename.length > 0 && file.filename.length <= 1000,
    'file.filename',
  );
  required(
    !file.filename.startsWith('/') &&
      !file.filename.includes('\\') &&
      file.filename.split('/').every((part) => part && part !== '.' && part !== '..'),
    'file.filename',
  );
  required(
    ['added', 'modified', 'deleted', 'renamed', 'copied', 'changed'].includes(file.status),
    'file.status',
  );
  for (const key of ['additions', 'deletions', 'changes']) {
    required(Number.isSafeInteger(file[key]) && file[key] >= 0, 'file.' + key);
  }
  required(
    file.patch === null ||
      (typeof file.patch === 'string' && Buffer.byteLength(file.patch) <= MAX_PATCH_BYTES),
    'file.patch',
  );
  return {
    filename: file.filename,
    status: file.status,
    additions: file.additions,
    deletions: file.deletions,
    changes: file.changes,
    patch: file.patch,
  };
}

function validatePRMeta(meta, repository, prNumber) {
  required(meta && typeof meta === 'object', 'metadata');
  required(meta.repository === repository, 'metadata.repository');
  required(meta.prNumber === prNumber, 'metadata.prNumber');
  required(meta.state === 'open', 'metadata.state');
  required(typeof meta.baseSHA === 'string' && SHA.test(meta.baseSHA), 'metadata.baseSHA');
  required(typeof meta.headSHA === 'string' && SHA.test(meta.headSHA), 'metadata.headSHA');
  return meta;
}

export function validateSnapshot(snapshot) {
  required(snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot), 'snapshot');
  required(snapshot.schemaVersion === 1, 'schemaVersion');
  required(typeof snapshot.repository === 'string', 'repository');
  required(Number.isSafeInteger(snapshot.prNumber) && snapshot.prNumber > 0, 'prNumber');
  for (const field of ['baseSHA', 'headSHA']) required(SHA.test(snapshot[field]), field);
  required(DIGEST.test(snapshot.diffDigest), 'diffDigest');
  required(Array.isArray(snapshot.files) && snapshot.files.length <= MAX_FILES, 'files');
  const normalized = snapshot.files.map(normalizeFile);
  required(
    new Set(normalized.map((file) => file.filename)).size === normalized.length,
    'files.duplicate',
  );
  required(
    normalized.every((file, i) => i === 0 || file.filename > normalized[i - 1].filename),
    'files.order',
  );
  required(snapshot.diffDigest === sha256(normalized), 'diffDigest.value');
  required(snapshot.complete === true, 'complete');
  return snapshot;
}

/**
 * Collects GitHub data through an injected read-only adapter. The adapter must
 * return {repository, prNumber, state, baseSHA, headSHA} metadata and pages of
 * {items, nextPage}; it cannot silently infer the end of pagination.
 */
export async function collectSnapshot(api, options) {
  required(
    api && typeof api.getPullRequest === 'function' && typeof api.listChangedFiles === 'function',
    'adapter',
  );
  required(options && typeof options.repository === 'string', 'options.repository');
  required(Number.isSafeInteger(options.prNumber) && options.prNumber > 0, 'options.prNumber');
  const first = validatePRMeta(
    await api.getPullRequest(options.repository, options.prNumber),
    options.repository,
    options.prNumber,
  );
  const files = [];
  let page = 1;
  while (true) {
    const result = await api.listChangedFiles(options.repository, options.prNumber, page);
    required(result && Array.isArray(result.items) && result.items.length <= 100, 'files.page');
    files.push(...result.items.map(normalizeFile));
    required(files.length <= MAX_FILES, 'files.count');
    required(
      result.nextPage === null || (Number.isSafeInteger(result.nextPage) && result.nextPage > page),
      'files.pagination',
    );
    if (result.nextPage === null) break;
    page = result.nextPage;
  }
  const second = validatePRMeta(
    await api.getPullRequest(options.repository, options.prNumber),
    options.repository,
    options.prNumber,
  );
  required(
    first.baseSHA === second.baseSHA && first.headSHA === second.headSHA,
    'metadata.changed',
  );
  files.sort((a, b) => a.filename.localeCompare(b.filename));
  const snapshot = {
    schemaVersion: 1,
    repository: options.repository,
    prNumber: options.prNumber,
    baseSHA: first.baseSHA,
    headSHA: first.headSHA,
    files,
    diffDigest: sha256(files),
    complete: true,
  };
  validateSnapshot(snapshot);
  const input = validateReviewInput({
    schemaVersion: 1,
    repository: options.repository,
    prNumber: options.prNumber,
    baseSHA: first.baseSHA,
    headSHA: first.headSHA,
    diffDigest: snapshot.diffDigest,
    policyRevision: options.policyRevision,
    specRevision: options.specRevision,
    adrRevision: options.adrRevision,
    knowledgeLockDigest: options.knowledgeLockDigest,
    applicability: options.applicability,
  });
  return { snapshot, input };
}
