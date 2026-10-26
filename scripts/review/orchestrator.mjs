import {
  REVIEW_AXES,
  validateReviewInput,
  validateReviewReport,
  validateReviewSet,
} from './contracts.mjs';

const STATES = Object.freeze([
  'queued',
  'reviewing',
  'validated',
  'complete',
  'blocked',
  'failed',
  'cancelled',
  'superseded',
]);

function fail(field) {
  throw new Error('Invalid review orchestration: ' + field);
}
function required(condition, field) {
  if (!condition) fail(field);
}

function freeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) freeze(child);
  return value;
}

function validateLimits(limits) {
  required(limits && typeof limits === 'object', 'limits');
  required(
    Number.isSafeInteger(limits.maxConcurrent) &&
      limits.maxConcurrent > 0 &&
      limits.maxConcurrent <= 3,
    'limits.maxConcurrent',
  );
  required(
    Number.isSafeInteger(limits.timeoutMs) && limits.timeoutMs > 0 && limits.timeoutMs <= 600_000,
    'limits.timeoutMs',
  );
  required(
    Number.isSafeInteger(limits.maxTechnicalRetries) &&
      limits.maxTechnicalRetries >= 0 &&
      limits.maxTechnicalRetries <= 1,
    'limits.maxTechnicalRetries',
  );
  return limits;
}

function timeout(worker, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('worker timeout')), ms);
    Promise.resolve()
      .then(worker)
      .then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (error) => {
          clearTimeout(timer);
          reject(error);
        },
      );
  });
}

/**
 * Run injected read-only workers. This module provides lifecycle and bounded
 * scheduling only; it does not authenticate workers, access GitHub, invoke a
 * model or decide whether a PR may merge.
 */
export async function runReviewOrchestration({
  input,
  runId,
  workers,
  limits,
  isCurrent = async () => true,
}) {
  validateReviewInput(input);
  required(typeof runId === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(runId), 'runId');
  validateLimits(limits);
  required(workers && typeof workers === 'object' && !Array.isArray(workers), 'workers');
  for (const axis of REVIEW_AXES) required(typeof workers[axis] === 'function', 'workers.' + axis);
  required(typeof isCurrent === 'function', 'isCurrent');
  if (!(await isCurrent(input))) return { state: 'superseded', runId, reports: [], attempts: {} };

  const context = freeze({ runId, input: structuredClone(input) });
  const reports = [];
  const attempts = Object.fromEntries(REVIEW_AXES.map((axis) => [axis, 0]));
  const failures = [];
  let cursor = 0;
  async function next() {
    while (true) {
      const axis = REVIEW_AXES[cursor++];
      if (!axis) return;
      let lastError;
      for (let attempt = 1; attempt <= limits.maxTechnicalRetries + 1; attempt++) {
        attempts[axis] = attempt;
        try {
          const report = await timeout(
            () => workers[axis](Object.freeze({ ...context, axis })),
            limits.timeoutMs,
          );
          validateReviewReport(report, input, runId);
          reports.push(report);
          lastError = undefined;
          break;
        } catch (error) {
          lastError = error;
        }
      }
      if (lastError) failures.push({ axis, reason: 'worker failed' });
    }
  }
  await Promise.all(Array.from({ length: limits.maxConcurrent }, next));
  if (!(await isCurrent(input))) return { state: 'superseded', runId, reports, attempts, failures };
  if (failures.length) return { state: 'blocked', runId, reports, attempts, failures };
  try {
    validateReviewSet(reports, input, runId);
  } catch {
    return {
      state: 'blocked',
      runId,
      reports,
      attempts,
      failures: [{ axis: 'set', reason: 'incomplete report set' }],
    };
  }
  return { state: 'complete', runId, reports, attempts, failures: [] };
}

export { STATES };
