# tending

**Relationships are living things.** Tending is a relationship management
tool for social purpose organisations — a relationship-first rethink of a
CRM, at [tending.network](https://tending.network).

Write moments as you'd tell a colleague ("Bumped into Amara at the allotment
— she offered to introduce me to the council food team") and Tending does the
filing: it recognises the people, organisations and spaces you mention, grows
a living network between them, writes each relationship's story, and gently
tells you when a thread is going quiet.

The mycelium metaphor runs all the way through: relationships are threads,
interactions are moments, the network lives under the soil.

## What's inside

- **Moments** — the atomic unit. Natural-language notes with deterministic
  entity recognition (your org's connections and spaces), optional voice
  capture (ElevenLabs Scribe or OpenAI Whisper), and AI enhancement for
  event dates and quality signals.
- **The network** — a living, breathing D3 force graph of your relationships,
  with vitality encoding (fresh → dormant) and constellation clustering.
- **Stories** — AI-written narratives per relationship, updated as moments
  accrue.
- **Observations** — pattern detection: dormant threads, quality shifts,
  dependency risks. Noticed, not measured.
- **Spaces** — the places where threads cross.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind v4 · Drizzle ORM + Neon
Postgres · NextAuth v5 · Stripe · D3 · OpenRouter/Ollama for AI ·
ElevenLabs/OpenAI for voice.

## Development

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL + AUTH_SECRET at minimum
npm run dev
```

- `npm test` — Vitest
- `npm run build` / `npm run lint`
- `npm run db:push` — push Drizzle schema to the database
- `npx tsc --noEmit` — typecheck

See `CLAUDE.md` for project conventions and `docs/` for end-user
documentation (mkdocs).

## Pricing

Flat £5/month, everything included, 30-day free trial, no card required.
