import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const required = [
  'README.md', 'AGENTS.md', 'knowledge.lock.json', 'pnpm-workspace.yaml',
  'docs/workflow.md', 'docs/reviews/axes.md', '.github/workflows/ci.yml',
  'docs/knowledge-integration.md', 'docs/infrastructure/mcp.md',
  'scripts/knowledge/lib.mjs', 'scripts/knowledge-status.mjs', 'scripts/spec-scaffold.mjs',
  '.agents/skills/knowledge-sync/SKILL.md', '.agents/skills/spec-authoring/SKILL.md',
  'apps/web/package.json', 'apps/server/package.json',
  'packages/game-core/package.json', 'packages/protocol/package.json',
  'packages/test-utils/package.json',
];
const missing = required.filter(p => !existsSync(resolve(root, p)));
if (missing.length) throw new Error('Missing bootstrap files: ' + missing.join(', '));

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const lock = JSON.parse(readFileSync(resolve(root, 'knowledge.lock.json'), 'utf8'));
if (pkg.packageManager !== 'pnpm@10.34.7') throw new Error('Unexpected package manager version');
if (lock.source.repository !== 'Daniil-33/economic-board-game') throw new Error('Unexpected knowledge source');
if (!/^[0-9a-f]{40}$/.test(lock.source.commit)) throw new Error('Invalid pinned knowledge commit');
if (lock.source.access !== 'private' || lock.syncPolicy.allowCopyPrivateSource !== false) {
  throw new Error('Knowledge source must remain private and read-only');
}
for (const p of ['apps/web', 'apps/server', 'packages/game-core', 'packages/protocol', 'packages/test-utils']) {
  const child = JSON.parse(readFileSync(resolve(root, p, 'package.json'), 'utf8'));
  if (!child.private || !child.scripts.typecheck) throw new Error('Invalid workspace package: ' + p);
}
for (const cmd of ['knowledge:status','knowledge:verify','spec:new']) {
  if (typeof pkg.scripts[cmd] !== 'string') throw new Error('Missing knowledge command: ' + cmd);
}
console.log('Bootstrap structure and source provenance validated.');
