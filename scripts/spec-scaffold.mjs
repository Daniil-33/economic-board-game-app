#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { readKnowledgeLock, buildSpecFiles, REPO_ROOT } from './knowledge/lib.mjs';

function main(args) {
  let slug;
  const sourcePaths = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--slug' && args[i + 1]) slug = args[++i];
    else if (args[i] === '--source' && args[i + 1]) sourcePaths.push(args[++i]);
    else throw new Error('Usage: spec-scaffold --slug 001-feature --source docs/path.md');
  }
  const artifacts = buildSpecFiles(readKnowledgeLock(), { slug, sourcePaths });
  const directory = resolve(REPO_ROOT, 'specs', slug);
  if (existsSync(directory)) throw new Error('Spec directory already exists; no overwrite');
  mkdirSync(directory, { recursive: true });
  for (const [p, contents] of Object.entries(artifacts)) {
    writeFileSync(resolve(REPO_ROOT, p), contents, { flag: 'wx', mode: 0o644 });
  }
  console.log('Created Draft spec: specs/' + slug + ' (not authorized for implementation)');
}

try {
  main(process.argv.slice(2));
} catch (error) {
  console.error('Spec scaffold failed: ' + error.message);
  process.exitCode = 1;
}
