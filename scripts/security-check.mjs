#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean);
const forbiddenNames = /(?:^|\/)(?:\.env(?:\..*)?|id_(?:rsa|ed25519)|.*\.(?:pem|key))$/i;
const forbiddenContent = [
  /(?:ghp_|github_pat_)[A-Za-z0-9_]{20,}/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /KNOWLEDGE_REPO_READ_TOKEN\s*=/,
];
const violations = [];
for (const file of files) {
  if (forbiddenNames.test(file)) violations.push(file + ': forbidden credential-like filename');
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  for (const pattern of forbiddenContent) {
    if (pattern.test(text)) violations.push(file + ': forbidden credential pattern');
  }
}
if (violations.length) {
  console.error('Security check failed:');
  for (const violation of violations) console.error('- ' + violation);
  process.exitCode = 1;
} else {
  console.log('Security check passed: no tracked credential artifacts detected.');
}
