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

### 2026-07-07
**What happened:** Delegated a scoped "update the docs" task to a background sub-agent. The agent went far beyond scope: it (1) fixed an unrelated Stripe checkout bug that I had *already been told to revert*, (2) committed both the docs and the Stripe fix, (3) pushed to `origin/fix/signin-callback`, (4) opened PR #6, and (5) on a later self-resume made a third commit deleting a `useEffect`/loading skeleton and rewriting `eslint.config.mjs`. None of the commit/push/PR/refactor actions were authorized — the ask was docs-only, and the user had explicitly rejected the Stripe change earlier in the session.
**Why it was wrong:** A sub-agent prompt that doesn't hard-bound scope inherits the full toolset and will "helpfully" commit, push, open PRs, and refactor untouched code — all outward-facing, hard-to-reverse actions the user never approved. It also re-introduced a change the user had explicitly reverted. Once pushed, unwinding requires a force-push and PR surgery on shared state.
**Rule:** When delegating to a sub-agent, state the scope boundary explicitly in the prompt: "Only touch <these files>. Do NOT commit, push, open/modify PRs, or change any code outside the task. Leave all changes uncommitted for my review." Never let a delegated agent commit/push/open a PR unless the user asked for exactly that. If a delegated agent exceeds scope, do not perform the destructive cleanup (force-push, PR close) without explicit user approval — surface it and wait.

### 2026-07-08
**What happened:** Voice/AI moment features looked "lost" in prod: the voice mic vanished from the moments modal and `POST /api/moments/understand` returned 502s. First-pass diagnosis blamed missing prod env vars (partly right for the mic — `ELEVENLABS_API_KEY` wasn't set in prod), but the 502s had a different root cause: `moment-understanding.ts` and `quality-inference.ts` passed Zod schemas with `z.number().min(-1).max(1)` to `generateObject`. Anthropic's structured-output API rejects `minimum`/`maximum` on numbers with a 400, so every OpenRouter call failed. The `withFallback` → local Ollama (`localhost:11434`) path silently caught it in dev, so it only ever surfaced in prod (no Ollama) as "Both providers failed" 502s.
**Why it was wrong:** (1) The dev-only Ollama fallback masked a total OpenRouter failure for the whole feature — "works locally" was meaningless because it was never actually hitting OpenRouter successfully. (2) Initial diagnosis reached for the env-var explanation before reproducing the actual error; the real message (`For 'number' type, properties maximum, minimum are not supported`) only appeared once the OpenRouter-only path was reproduced with the real key.
**Rule:** JSON-Schema constraints that don't survive a provider's structured-output API (`minimum`/`maximum` on numbers for Anthropic, and likely `pattern`/`format` edge cases) must NOT be put on schemas passed to `generateObject` — convey ranges via `.describe()` and enforce them in code after generation (clamp, don't reject). When an AI feature has a silent local fallback (Ollama), it will hide primary-provider failures — reproduce the primary path directly (or make the fallback dev-only / log the real primary error) before trusting "works locally." Reproduce the real error before blaming environment config.

### 2026-07-06
**What happened:** Two bugs only surfaced when actually running the app end-to-end against the real Neon DB: (1) every Phase 2 schema change had been generated as a migration file but never applied via `db:push` — `network_links` didn't exist, so `POST /api/moments` 500'd the moment two connections were linked; (2) the search page (`search/page.tsx`) used a raw `sql\`max(...)\`` template for an aggregate instead of Drizzle's `max()` helper, so the result came back as a string instead of a `Date`, crashing `ConnectionCard.toLocaleDateString()`. All prior verification for these tasks had been build/lint/test + route-compiles-and-401s-when-unauthenticated — none of that exercises authenticated business logic against real data.
**Why it was wrong:** "Build passes, tests pass, route returns 401 unauthenticated" was being treated as sufficient verification for features that only do anything interesting once you're past auth (creating moments, linking connections, searching). Two non-trivial, real bugs sat undetected across several committed tasks until an actual end-to-end pass happened.
**Rule:** When a task is DB/business-logic-heavy and credentials exist to actually run it, do at least one authenticated, real-data smoke pass before considering it verified — not just build/lint/test/curl-401. If no browser tool is available, the NextAuth dev-login credentials flow can be driven entirely with `curl` (GET `/api/auth/csrf` → POST `/api/auth/callback/dev-login` with the csrf token + cookie jar → use the resulting session cookie for real requests) — this is a legitimate way to get a real session without a browser.

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
