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

### 2026-07-03
**What happened:** `.env.example` contained real, live secrets — an actual Neon `DATABASE_URL` with a working password and a real `AUTH_SECRET` — instead of placeholder values. Initially reported this as "committed to git history" and treated it as a git-history risk; on closer check, `.gitignore` has a blanket `.env*` rule, so `.env.example` was never actually tracked — it only ever existed on disk. The risk was overstated.
**Why it was wrong:** Two mistakes stacked: (1) `.env.example` shouldn't hold real secrets regardless of git tracking — it's meant to be shareable, and the whole point is placeholder values; (2) I asserted "committed since e21576a" without first checking `git ls-files`/`git log -- .env.example`, i.e. stated a git-history claim without verifying it.
**Rule:** Never state a git-history claim ("this is committed", "this went out in commit X") without first running the check (`git log --oneline -- <path>` or `git ls-files | grep <path>`) — verify before asserting, especially when the claim is being used to justify urgency to the user.

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
