import { isDeepStrictEqual } from 'node:util';

export const REVIEW_AXES = Object.freeze([
  'design',
  'specification',
  'correctness',
  'performance',
  'security',
  'style',
]);
const sha = /^[a-f0-9]{40}$/;
const digest = /^[a-f0-9]{64}$/;
const token = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/;

// Errors deliberately exclude untrusted values, which may contain private text.
function requireValue(condition, field) {
  if (!condition) throw new Error('Invalid review contract: ' + field);
}
function object(value, fields, field) {
  requireValue(value !== null && typeof value === 'object' && !Array.isArray(value), field);
  requireValue(
    Object.keys(value).length === fields.length && fields.every((key) => Object.hasOwn(value, key)),
    field,
  );
}
function text(value, field) {
  requireValue(typeof value === 'string' && value.trim().length > 0 && value.length <= 8000, field);
}
function match(value, expression, field) {
  requireValue(typeof value === 'string' && expression.test(value), field);
}
function texts(value, field, allowEmpty = true) {
  requireValue(
    Array.isArray(value) && value.length <= 1000 && (allowEmpty || value.length > 0),
    field,
  );
  value.forEach((item) => text(item, field));
}

/** Validate identity only; caller must independently authenticate its provenance. */
export function validateReviewInput(input) {
  object(
    input,
    [
      'schemaVersion',
      'repository',
      'prNumber',
      'baseSHA',
      'headSHA',
      'diffDigest',
      'policyRevision',
      'specRevision',
      'adrRevision',
      'knowledgeLockDigest',
      'applicability',
    ],
    'input',
  );
  requireValue(input.schemaVersion === 1, 'input.schemaVersion');
  match(input.repository, /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, 'input.repository');
  requireValue(Number.isSafeInteger(input.prNumber) && input.prNumber > 0, 'input.prNumber');
  for (const field of ['baseSHA', 'headSHA', 'policyRevision', 'specRevision', 'adrRevision']) {
    match(input[field], sha, 'input.' + field);
  }
  for (const field of ['diffDigest', 'knowledgeLockDigest'])
    match(input[field], digest, 'input.' + field);
  requireValue(['infrastructure', 'gameplay'].includes(input.applicability), 'input.applicability');
  return input;
}

function evidence(item) {
  object(item, ['kind', 'reference', 'claim'], 'evidence');
  requireValue(['observed', 'inferred', 'not-run'].includes(item.kind), 'evidence.kind');
  text(item.reference, 'evidence.reference');
  text(item.claim, 'evidence.claim');
}
function finding(item, axis) {
  object(
    item,
    ['id', 'axis', 'severity', 'location', 'evidence', 'risk', 'recommendedFix', 'testSuggestion'],
    'finding',
  );
  match(item.id, token, 'finding.id');
  requireValue(item.axis === axis, 'finding.axis');
  requireValue(['P0', 'P1', 'P2', 'P3'].includes(item.severity), 'finding.severity');
  object(item.location, ['file', 'line', 'scope'], 'finding.location');
  if (item.location.file === null) {
    requireValue(item.location.line === null, 'finding.location.line');
    text(item.location.scope, 'finding.location.scope');
  } else {
    text(item.location.file, 'finding.location.file');
    requireValue(
      !item.location.file.startsWith('/') &&
        !item.location.file.includes('\\') &&
        item.location.file.split('/').every((part) => part && part !== '.' && part !== '..'),
      'finding.location.file',
    );
    requireValue(
      Number.isSafeInteger(item.location.line) && item.location.line > 0,
      'finding.location.line',
    );
    requireValue(item.location.scope === null, 'finding.location.scope');
  }
  requireValue(
    Array.isArray(item.evidence) && item.evidence.length > 0 && item.evidence.length <= 1000,
    'finding.evidence',
  );
  item.evidence.forEach(evidence);
  for (const field of ['risk', 'recommendedFix', 'testSuggestion'])
    text(item[field], 'finding.' + field);
}

/** Structural validation is NOT a test attestation, approval or merge gate. */
export function validateReviewReport(report, expectedInput, expectedRunId) {
  validateReviewInput(expectedInput);
  match(expectedRunId, token, 'expectedRunId');
  object(
    report,
    [
      'schemaVersion',
      'runId',
      'axis',
      'reviewer',
      'input',
      'startedAt',
      'completedAt',
      'coverage',
      'gaps',
      'disposition',
      'reason',
      'evidence',
      'findings',
    ],
    'report',
  );
  requireValue(report.schemaVersion === 1, 'report.schemaVersion');
  requireValue(report.runId === expectedRunId, 'report.runId');
  requireValue(REVIEW_AXES.includes(report.axis), 'report.axis');
  validateReviewInput(report.input);
  requireValue(isDeepStrictEqual(report.input, expectedInput), 'report.input mismatch');
  object(report.reviewer, ['id', 'model', 'configDigest', 'promptDigest'], 'report.reviewer');
  match(report.reviewer.id, token, 'report.reviewer.id');
  text(report.reviewer.model, 'report.reviewer.model');
  match(report.reviewer.configDigest, digest, 'report.reviewer.configDigest');
  match(report.reviewer.promptDigest, digest, 'report.reviewer.promptDigest');
  for (const field of ['startedAt', 'completedAt']) {
    requireValue(
      typeof report[field] === 'string' &&
        Number.isFinite(Date.parse(report[field])) &&
        new Date(report[field]).toISOString() === report[field],
      'report.' + field,
    );
  }
  requireValue(Date.parse(report.completedAt) >= Date.parse(report.startedAt), 'report.timing');
  texts(report.coverage, 'report.coverage', false);
  texts(report.gaps, 'report.gaps');
  requireValue(
    ['pass', 'findings', 'blocked', 'not-applicable'].includes(report.disposition),
    'report.disposition',
  );
  text(report.reason, 'report.reason');
  requireValue(
    Array.isArray(report.evidence) && report.evidence.length > 0 && report.evidence.length <= 1000,
    'report.evidence',
  );
  report.evidence.forEach(evidence);
  requireValue(Array.isArray(report.findings) && report.findings.length <= 1000, 'report.findings');
  report.findings.forEach((item) => finding(item, report.axis));
  requireValue(
    new Set(report.findings.map((item) => item.id)).size === report.findings.length,
    'finding.duplicateId',
  );
  if (report.gaps.length) requireValue(report.disposition === 'blocked', 'report.gaps disposition');
  if (report.disposition === 'pass' || report.disposition === 'not-applicable') {
    requireValue(report.findings.length === 0, 'report.findings disposition');
  }
  if (report.disposition === 'findings')
    requireValue(report.findings.length > 0, 'report.empty findings');
  return report;
}

/** Returns validated data, never a pass/fail decision for the PR. */
export function validateReviewSet(reports, expectedInput, expectedRunId) {
  requireValue(Array.isArray(reports) && reports.length === REVIEW_AXES.length, 'reports.count');
  reports.forEach((report) => validateReviewReport(report, expectedInput, expectedRunId));
  requireValue(
    new Set(reports.map((report) => report.axis)).size === REVIEW_AXES.length,
    'reports.duplicateAxis',
  );
  requireValue(
    new Set(reports.map((report) => report.reviewer.id)).size === REVIEW_AXES.length,
    'reports.duplicateReviewer',
  );
  return reports;
}
