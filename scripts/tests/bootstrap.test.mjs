import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

test('workspace provenance and minimum skeleton are valid', () => {
  const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
  const output = execFileSync(process.execPath, ['scripts/validate-bootstrap.mjs'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.match(output, /validated/);
});
