#!/usr/bin/env node
import { readKnowledgeLock, inspectPrivateDocumentStatus, verifyKnowledgeSource } from './knowledge/lib.mjs';

async function run(args) {
  const lock = readKnowledgeLock();
  let online = false;
  const paths = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--online') online = true;
    else if (args[i] === '--path' && args[i + 1]) paths.push(args[++i]);
    else throw new Error('Usage: knowledge-status [--online] [--path docs/name.md]');
  }
  if (!online && paths.length) throw new Error('--path requires --online');
  console.log('Pinned private knowledge revision: ' + lock.source.commit);
  if (!online) {
    console.log('OFFLINE: lock structure only; no external freshness or access verified');
    return;
  }
  const token = process.env.KNOWLEDGE_REPO_READ_TOKEN;
  const meta = await verifyKnowledgeSource(lock, token);
  console.log('Source pinned commit: verified');
  console.log('Source branch freshness: ' + meta.freshness);
  for (const path of paths) {
    const result = await inspectPrivateDocumentStatus(lock, path, token);
    console.log('Explicit document approval label: ' + result.path + ' = ' + result.documentStatus);
  }
  if (meta.freshness === 'STALE') process.exitCode = 2;
}

run(process.argv.slice(2)).catch(error => {
  console.error('Knowledge check failed: ' + error.message);
  process.exitCode = 1;
});
