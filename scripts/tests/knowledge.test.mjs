import test from 'node:test';
import assert from 'node:assert/strict';
import {
  readKnowledgeLock, validateKnowledgeLock, validateSourcePath, parseDocumentStatus,
  verifyKnowledgeSource, inspectPrivateDocumentStatus, buildSpecFiles,
} from '../knowledge/lib.mjs';

const lock = readKnowledgeLock();
const sha = lock.source.commit;

test('knowledge lock is private, pinned, read-only and fail-closed', () => {
  assert.equal(sha.length, 40);
  assert.equal(lock.syncPolicy.mode, 'read-only');
  assert.equal(lock.source.access, 'private');
  assert.throws(() => validateKnowledgeLock({
    ...lock, syncPolicy: { ...lock.syncPolicy, allowCopyPrivateSource: true },
  }));
  assert.throws(() => validateKnowledgeLock({
    ...lock, source: { ...lock.source, repository: 'attacker/repo' },
  }));
});

test('source paths reject traversal and extra query parameters', () => {
  assert.equal(validateSourcePath('docs/a/feature.md'), 'docs/a/feature.md');
  for (const path of ['../x.md', 'docs/../secret.md', 'docs//a.md', 'docs/x?ref=main.md', 'README.md', 'docs/a\\x.md']) {
    assert.throws(() => validateSourcePath(path));
  }
});

test('source headers never infer approval from proposal bodies', () => {
  assert.equal(parseDocumentStatus('# A\n\n- **Status:** Proposed / Discovery'), 'PROPOSED');
  assert.equal(parseDocumentStatus('# A\n\n- **Status:** Approved'), 'APPROVED');
  assert.equal(parseDocumentStatus('This is approved in the body'), 'UNKNOWN');
});

test('verifier validates pinned commit and detects branch drift without modifying lock', async () => {
  let branchHead = sha;
  const calls = [];
  const fakeFetch = async (url, options) => {
    calls.push({url,options});
    return {
      ok: true,
      json: async () => url.includes('/git/ref/heads/') ? { object: { sha: branchHead } } : { sha },
    };
  };
  const before = JSON.stringify(lock);
  assert.equal((await verifyKnowledgeSource(lock, 'fake-token', fakeFetch)).freshness, 'CURRENT');
  branchHead = 'f'.repeat(40);
  assert.equal((await verifyKnowledgeSource(lock, 'fake-token', fakeFetch)).freshness, 'STALE');
  assert.equal(JSON.stringify(lock), before);
  for (const c of calls) {
    assert.equal(c.options.method, 'GET');
    assert.ok(!c.url.includes('fake-token'));
    assert.ok(c.url.startsWith('https://api.github.com/repos/Daniil-33/economic-board-game/'));
  }
});

test('private read inspects only explicit document status and does not echo secret', async () => {
  const raw = '# Private secrets\n\n- **Status:** Proposed / Discovery\nNOT_PUBLIC';
  const fakeFetch = async (url) => {
    assert.match(url, /ref=[0-9a-f]{40}$/);
    return { ok: true, json: async () => ({
      type: 'file', encoding: 'base64', size: Buffer.byteLength(raw),
      content: Buffer.from(raw).toString('base64'),
    }) };
  };
  const status = await inspectPrivateDocumentStatus(lock, 'docs/example.md', 'test-token', fakeFetch);
  assert.equal(status.documentStatus, 'PROPOSED');
  assert.ok(!JSON.stringify(status).includes('NOT_PUBLIC'));
});

test('scaffold creates draft artifacts without product-source copies or approval claims', () => {
  const f = buildSpecFiles(lock, {slug:'001-engine-foundation',sourcePaths:['docs/decisions/0001-engine-boundaries.md']});
  assert.equal(Object.keys(f).length, 4);
  const meta = JSON.parse(f['specs/001-engine-foundation/provenance.json']);
  assert.equal(meta.approvedForImplementation, false);
  assert.equal(meta.gates.sourceStatuses, 'UNVERIFIED');
  assert.equal(meta.source.commit, sha);
  assert.match(f['specs/001-engine-foundation/spec.md'], /DRAFT/);
  assert.throws(() => buildSpecFiles(lock, {slug:'../escape',sourcePaths:['docs/x.md']}));
  assert.throws(() => buildSpecFiles(lock, {slug:'valid',sourcePaths:[]}));
});
