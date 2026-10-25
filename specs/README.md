# Technical specifications

Gameplay and economic rule decisions remain normative only in the private knowledge repository. This PUBLIC implementation repository owns technical plans, interfaces, ADRs, test scenarios and delivery tasks.

Create a Draft via:

    pnpm run spec:new -- --slug 001-game-engine --source docs/decisions/0001-engine-boundaries.md

The command creates spec.md, plan.md, tasks.md and provenance.json with an exact upstream SHA. It never includes private document contents or auto-approves anything; the provenance metadata starts with approvedForImplementation=false. Obtain verified source statuses and explicit human approval for product mechanics and technical architecture before implementing.

See docs/knowledge-integration.md.
