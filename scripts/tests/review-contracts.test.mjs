import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REVIEW_AXES,
  validateReviewInput,
  validateReviewReport,
  validateReviewSet,
} from '../review/contracts.mjs';

const input = {
  schemaVersion: 1,
  repository: 'example/project',
  prNumber: 3,
  baseSHA: 'a'.repeat(40),
  headSHA: 'b'.repeat(40),
  diffDigest: 'c'.repeat(64),
  policyRevision: 'd'.repeat(40),
  specRevision: 'e'.repeat(40),
  adrRevision: 'f'.repeat(40),
  knowledgeLockDigest: 'a'.repeat(64),
  applicability: 'infrastructure',
};
function report(axis = 'design') {
  return {
    schemaVersion: 1,
    runId: 'run-1',
    axis,
    reviewer: {
      id: axis + '-worker',
      model: 'fixture-model',
      configDigest: 'b'.repeat(64),
      promptDigest: 'c'.repeat(64),
    },
    input: structuredClone(input),
    startedAt: '2026-10-26T12:00:00.000Z',
    completedAt: '2026-10-26T12:01:00.000Z',
    coverage: ['scripts/review/contracts.mjs'],
    gaps: [],
    disposition: 'pass',
    reason: 'Static inspection completed; no tests claimed.',
    evidence: [
      {
        kind: 'observed',
        reference: 'scripts/review/contracts.mjs',
        claim: 'Read contract checks.',
      },
    ],
    findings: [],
  };
}
function finding() {
  return {
    id: 'f-1',
    axis: 'design',
    severity: 'P1',
    location: { file: 'scripts/example.mjs', line: 1, scope: null },
    evidence: [
      {
        kind: 'inferred',
        reference: 'scripts/example.mjs:1',
        claim: 'Unchecked input can bypass validation.',
      },
    ],
    risk: 'Invalid result accepted.',
    recommendedFix: 'Validate input.',
    testSuggestion: 'Reject malformed input.',
  };
}

test('complete independent reports validate without mutating inputs or deciding merge', () => {
  const reports = REVIEW_AXES.map((axis) => report(axis));
  const before = JSON.stringify(reports);
  assert.equal(validateReviewSet(reports, input, 'run-1'), reports);
  assert.equal(JSON.stringify(reports), before);
});

test('every immutable identity field is bound to the expected snapshot', () => {
  for (const field of Object.keys(input)) {
    const item = report();
    const replacements = {
      schemaVersion: 2,
      repository: 'other/project',
      prNumber: 4,
      applicability: 'gameplay',
    };
    item.input[field] = replacements[field] ?? '0'.repeat(item.input[field].length);
    assert.throws(
      () => validateReviewReport(item, input, 'run-1'),
      /Invalid review contract/,
      field,
    );
  }
  assert.throws(() => validateReviewReport(report(), input, 'run-2'), /runId/);
});

test('incomplete and duplicate reviewer sets cannot satisfy six axes', () => {
  const reports = REVIEW_AXES.map((axis) => report(axis));
  assert.throws(() => validateReviewSet(reports.slice(1), input, 'run-1'), /count/);
  reports[5] = report('design');
  assert.throws(() => validateReviewSet(reports, input, 'run-1'), /duplicateAxis/);
  reports[5] = report('style');
  reports[5].reviewer.id = reports[0].reviewer.id;
  assert.throws(() => validateReviewSet(reports, input, 'run-1'), /duplicateReviewer/);
});

test('blocked and justified inapplicable reports are data, not aggregate success', () => {
  const item = report();
  item.gaps = ['Required evidence unavailable.'];
  assert.throws(() => validateReviewReport(item, input, 'run-1'), /gaps disposition/);
  item.disposition = 'blocked';
  assert.equal(validateReviewReport(item, input, 'run-1').disposition, 'blocked');
  item.gaps = [];
  item.disposition = 'not-applicable';
  item.reason = '';
  assert.throws(() => validateReviewReport(item, input, 'run-1'), /reason/);
});

test('findings require valid severity, axis, locations and evidence', () => {
  const item = report();
  item.disposition = 'findings';
  item.findings = [finding()];
  validateReviewReport(item, input, 'run-1');
  for (const mutate of [
    (f) => {
      f.severity = 'P4';
    },
    (f) => {
      f.axis = 'security';
    },
    (f) => {
      f.evidence = [];
    },
    (f) => {
      f.location.file = '../private.md';
    },
    (f) => {
      f.location.line = 0;
    },
    (f) => {
      f.risk = '';
    },
  ]) {
    const invalid = structuredClone(item);
    mutate(invalid.findings[0]);
    assert.throws(() => validateReviewReport(invalid, input, 'run-1'), /Invalid review contract/);
  }
  item.findings[0].location = { file: null, line: null, scope: 'Repository-wide missing policy.' };
  validateReviewReport(item, input, 'run-1');
  item.findings.push(structuredClone(item.findings[0]));
  assert.throws(() => validateReviewReport(item, input, 'run-1'), /duplicateId/);
});

test('pass cannot hide findings and findings cannot be empty', () => {
  const item = report();
  item.findings = [finding()];
  assert.throws(() => validateReviewReport(item, input, 'run-1'), /findings disposition/);
  item.findings = [];
  item.disposition = 'findings';
  assert.throws(() => validateReviewReport(item, input, 'run-1'), /empty findings/);
});

test('unknown fields, malformed timing and unsupported evidence are rejected safely', () => {
  for (const mutate of [
    (r) => {
      r.privatePayload = 'PRIVATE_CANARY';
    },
    (r) => {
      r.startedAt = '2026-02-30T12:00:00.000Z';
    },
    (r) => {
      r.completedAt = '2026-10-25T12:00:00.000Z';
    },
    (r) => {
      r.evidence[0].kind = 'tests-passed-trust-me';
    },
    (r) => {
      delete r.reviewer;
    },
    (r) => {
      r.coverage = [];
    },
  ]) {
    const item = report();
    mutate(item);
    assert.throws(
      () => validateReviewReport(item, input, 'run-1'),
      (error) =>
        error.message.startsWith('Invalid review contract:') &&
        !error.message.includes('PRIVATE_CANARY'),
    );
  }
  for (const invalid of [null, [], {}, { ...input, prNumber: NaN }]) {
    assert.throws(() => validateReviewInput(invalid), /Invalid review contract/);
  }
});

test('expanded-year timestamps use chronological rather than lexical order', () => {
  const item = report();
  item.startedAt = '+010000-01-01T00:00:00.000Z';
  assert.throws(() => validateReviewReport(item, input, 'run-1'), /timing/);
  item.startedAt = '2026-10-26T12:00:00.000Z';
  item.completedAt = '+010000-01-01T00:00:00.000Z';
  validateReviewReport(item, input, 'run-1');
});
