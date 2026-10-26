import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPO_ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const SHA = /^[0-9a-f]{40}$/;

export function readKnowledgeLock(root = REPO_ROOT) {
  return validateKnowledgeLock(JSON.parse(readFileSync(resolve(root, 'knowledge.lock.json'), 'utf8')));
}

export function validateKnowledgeLock(lock) {
  if (!lock || lock.schemaVersion !== 1 || !lock.source || !lock.syncPolicy) {
    throw new Error('Invalid knowledge lock schema');
  }
  const s = lock.source;
  if (s.repository !== 'Daniil-33/economic-board-game' ||
      typeof s.ref !== 'string' || !/^(?:[A-Za-z0-9._-]+\/)*[A-Za-z0-9._-]+$/.test(s.ref) ||
      !SHA.test(s.commit) || s.access !== 'private' ||
      lock.syncPolicy.mode !== 'read-only' ||
      lock.syncPolicy.allowCopyPrivateSource !== false ||
      lock.syncPolicy.requireApprovalBeforeImplementation !== true) {
    throw new Error('Unsafe or malformed knowledge source');
  }
  return lock;
}

export function validateSourcePath(path) {
  if (typeof path !== 'string' || path.length > 240 ||
      !/^docs\/[a-zA-Z0-9._/-]+\.md$/.test(path) ||
      path.includes('..') || path.includes('//') || path.includes('\\') ||
      path.split('/').includes('.')) {
    throw new Error('Invalid knowledge document path');
  }
  return path;
}

export function parseDocumentStatus(markdown) {
  if (typeof markdown !== 'string') return 'UNKNOWN';
  for (const line of markdown.split(/\r?\n/).slice(0, 30)) {
    const m = line.match(/^\s*(?:[-*]\s*)?\*\*Status:\*\*\s*(.+)$/i);
    if (!m) continue;
    const v = m[1].trim().toLowerCase();
    for (const s of ['accepted', 'approved', 'proposed', 'draft', 'rejected']) {
      if (new RegExp('^' + s + '\\b').test(v)) return s.toUpperCase();
    }
    return 'UNKNOWN';
  }
  return 'UNKNOWN';
}

async function githubGet(url, token, fetchImpl) {
  if (typeof token !== 'string' || !token.trim()) {
    throw new Error('KNOWLEDGE_REPO_READ_TOKEN required for private source access');
  }
  if (!url.startsWith('https://api.github.com/repos/Daniil-33/economic-board-game/')) {
    throw new Error('Refused non-allowlisted URL');
  }
  const result = await fetchImpl(url, {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'ebg-private-source-verifier',
    },
  });
  if (!result.ok) {
    // Do not log response bodies, URL credential data or private upstream content.
    throw new Error('Private GitHub request failed (HTTP ' + result.status + ')');
  }
  return result.json();
}

export async function verifyKnowledgeSource(lock, token, fetchImpl = fetch) {
  validateKnowledgeLock(lock);
  const s = lock.source;
  const base = 'https://api.github.com/repos/' + s.repository;
  const [commit, ref] = await Promise.all([
    githubGet(base + '/commits/' + s.commit, token, fetchImpl),
    githubGet(base + '/git/ref/heads/' + s.ref.split('/').map(encodeURIComponent).join('/'), token, fetchImpl),
  ]);
  if (commit?.sha !== s.commit || !SHA.test(ref?.object?.sha ?? '')) {
    throw new Error('Private GitHub metadata did not match expected shapes');
  }
  return {
    repository: s.repository,
    lockedCommit: s.commit,
    branch: s.ref,
    branchCommit: ref.object.sha,
    freshness: ref.object.sha === s.commit ? 'CURRENT' : 'STALE',
  };
}

export async function inspectPrivateDocumentStatus(lock, path, token, fetchImpl = fetch) {
  validateKnowledgeLock(lock);
  validateSourcePath(path);
  const s = lock.source;
  const url = 'https://api.github.com/repos/' + s.repository + '/contents/' +
    path.split('/').map(encodeURIComponent).join('/') + '?ref=' + s.commit;
  const result = await githubGet(url, token, fetchImpl);
  if (result?.type !== 'file' || result?.encoding !== 'base64' ||
      !Number.isInteger(result.size) || result.size > 250000 || result.size < 0 ||
      typeof result.content !== 'string') {
    throw new Error('Private document cannot be safely inspected');
  }
  const raw = Buffer.from(result.content.replace(/\s/g, ''), 'base64').toString('utf8');
  // Return only approval metadata; never return private document text to callers.
  return { path, sourceCommit: s.commit, documentStatus: parseDocumentStatus(raw) };
}

export function buildSpecFiles(lock, { slug, sourcePaths }) {
  validateKnowledgeLock(lock);
  if (typeof slug !== 'string' || slug.length > 75 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('Invalid slug: use lowercase letters, digits and hyphens');
  }
  if (!Array.isArray(sourcePaths) || sourcePaths.length < 1 || sourcePaths.length > 20) {
    throw new Error('Provide one to twenty source document paths');
  }
  const paths = [...new Set(sourcePaths.map(validateSourcePath))];
  const base = 'specs/' + slug;
  const references = paths.map(p => '- ' + p + ' @ ' + lock.source.commit + ' [source status: UNVERIFIED]').join('\n');
  const spec = '# ' + slug + ' — technical specification\n\n' +
    'Status: DRAFT, not approved for implementation.\n\n' +
    'Source repository: ' + lock.source.repository + '\nSource commit: ' + lock.source.commit + '\n\n' +
    '## Sources (metadata only; private text not copied)\n\n' + references + '\n\n' +
    '## Requirements and acceptance scenarios\n\nTODO: write original technical requirements derived from separately approved private sources.\n\n' +
    '## Invariants and non-goals\n\nTODO: define state boundaries, hidden information, money/share conservation, rejection states.\n\n' +
    '## Approvals\n\n- [ ] Verify each source status at pinned SHA in trusted private environment.\n' +
    '- [ ] Resolve Draft/Proposed source conflicts.\n- [ ] Obtain explicit human approval for behavior and implementation.\n';
  const plan = '# ' + slug + ' — technical plan\n\nStatus: DRAFT\n\n' +
    'Source commit: ' + lock.source.commit + '\n\n' +
    '## Architecture and implementation boundaries\n\nTODO: interfaces, dependencies, ADRs and error handling.\n\n' +
    '## Tests and risk\n\nTODO: deterministic acceptance and error cases, benchmarks, security.\n';
  const tasks = '# ' + slug + ' — implementation tasks\n\nStatus: DRAFT / NOT AUTHORIZED\n\n' +
    '- [ ] Human approval of specs and architecture.\n' +
    '- [ ] Implement scoped changes and tests on a feature branch.\n' +
    '- [ ] Independent review, CI checks and human merge gate.\n';
  return {
    [base + '/spec.md']: spec,
    [base + '/plan.md']: plan,
    [base + '/tasks.md']: tasks,
    [base + '/provenance.json']: JSON.stringify({
      schemaVersion: 1, status: 'DRAFT', approvedForImplementation: false,
      source: { repository: lock.source.repository, commit: lock.source.commit, paths },
      gates: { sourceStatuses: 'UNVERIFIED', humanApprovalRequired: true },
    }, null, 2) + '\n',
  };
}
