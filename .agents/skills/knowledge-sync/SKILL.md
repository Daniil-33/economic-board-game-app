---
name: knowledge-sync
description: Pin, validate and analyze relevant private product knowledge without copying it to public outputs.
---

# Knowledge sync (read-only)

1. Read `knowledge.lock.json` and verify `source.ref` resolves to the specified `source.commit`; report drift, do not silently advance the lock.
2. Using approved private GitHub MCP credentials, inspect **only relevant** upstream files from the locked commit (not branch HEAD). Respect each document's Agreed/Proposed/Open status.
3. Produce a short private change-impact report: upstream references, technical specs affected, conflicts, approval blockers and proposed next commit.
4. In the **public implementation PR**, include only approved rule IDs, commit SHA, safe general descriptions and public implementation changes; never paste private upstream content, credentials, private MCP transcripts or hidden bids.
5. Human approval is required before raising a lock refresh or changing accepted implementation scope. Never push to the knowledge repo with this skill.
