# Mistakes & Lessons Learned

Things that went wrong and what to do instead. This file is the most important feedback loop for improving Claude's performance on this project.

**How to use this file:**
- After every correction, add an entry here
- Tell Claude: "Add what just happened to MISTAKES.md so you don't repeat it"
- Periodically review and promote recurring patterns into CLAUDE.md as rules
- Delete entries that have been promoted to CLAUDE.md to avoid duplication

---

## Mistakes Log

<!--
### [date]
**What happened:** [What Claude did wrong]
**Why it was wrong:** [Why this was a problem in this context]
**Rule:** [What Claude should do instead — be specific and actionable]
-->

### 2026-07-02
**What happened:** Planned a `@testing-library/react` smoke test for the new `NetworkGraph` component, assuming jsdom was "genuinely wired up" because it's a devDependency with a documented `// @vitest-environment jsdom` override pattern. It had never actually been exercised — the test failed at vitest worker startup with `ERR_REQUIRE_ESM`, because jsdom 27's `@csstools/css-calc` (via `@asamuzakjp/css-color`) requires Node ≥20.19 and ships ESM-only, but this machine runs Node v20.18.1.
**Why it was wrong:** The Node engine mismatch was already flagged in STATE.md's Known Issues as "cosmetic only" — it isn't. It fully breaks the jsdom test environment, not just some peer-dependency install warnings.
**Rule:** Before assuming an unused-but-configured test environment (jsdom, a DB test harness, etc.) actually works, run one trivial test in it first rather than building the real test on top of an unverified assumption. If it's broken, don't leave a permanently-failing test file in the repo — drop it and note the environment limitation in STATE.md instead.

---

## Patterns That Didn't Work

Approaches we tried that turned out to be wrong for this project. Don't try these again.

<!--
### [Approach name]
**What we tried:** [Description]
**Why it failed:** [What went wrong]
**What works instead:** [The better approach]
-->

---

## Promoted to CLAUDE.md

Entries that have been moved into CLAUDE.md as permanent rules. Kept here for reference.

<!--
- [date]: [Rule summary] — moved to CLAUDE.md
-->
