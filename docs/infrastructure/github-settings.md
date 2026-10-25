# GitHub repository governance — manual admin setup

This file describes desired settings; **these settings have not been applied by this bootstrap PR**. The available GitHub app actions do not expose ruleset/branch-protection writes.

## Recommended main ruleset
- Disallow direct pushes and force pushes; allow merges from PRs only.
- Require successful checks, up-to-date branches or merge queue, and no unresolved conversations.
- Require at least one **human** approval from someone other than the PR author (GitHub does not count a user's self-approval); if working solo, use a deliberate maintainer merge gate compatible with repo permissions and avoid claiming an unenforceable second reviewer.
- Require status contexts `bootstrap / checks` only after the workflow has run at least once and the exact context name is confirmed.
- Restrict bypass roles, keep squash merge, disable unreviewed auto-merge and delete branches after merge.
- Approve Actions/third-party apps and dependabot permissions separately. Never grant workflow PR untrusted code write access.

## Visibility boundary
**This repository is public**, while the knowledge source is private. Before sharing any generated artifact externally, verify it contains no private gameplay text from upstream. `knowledge.lock.json` contains only repo identifier, branch and commit metadata. Public CI intentionally does not fetch private content. If private source quotations become necessary, switch implementation repository to private first or use explicitly approved private summaries.

## CI rollout
The bootstrap workflow uses an unfrozen install **temporarily** because there is no existing `pnpm-lock.yaml`. Generate and commit a real lockfile with the pinned pnpm version, then change CI to `--frozen-lockfile` before enforcing required checks. Never fake a generated lockfile.
