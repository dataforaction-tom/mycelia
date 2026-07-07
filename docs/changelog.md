# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

## [2026-07-07]

### Added

- **Guided tour for new organisations** — sign-up now seeds a small example network (a person, a programme, a quiet funder), and a short spotlight walkthrough introduces the moment composer, your dashboard pulse, the Network view, and observations. At the end you choose to keep exploring the example data or clear it in one click.
- **Voice notes** — speak a moment instead of typing it; Tending transcribes what you said and drops it straight into the composer.
- **Instant recognition in the moment composer** — as you type, people, groups, and spaces you mention are recognised immediately and shown as chips, with no wait for AI. Tending's AI understanding still runs quietly alongside to catch fuzzier mentions and suggest event dates.
- **Vitality on connection cards** — each card now shows a short story teaser and an at-a-glance sense of how alive the relationship is (active, fading, or gone quiet), reflected in how brightly it's shown.
- **Redesigned Network view** — a warmer, more organic "living network" look, with glowing connecting threads and node colouring that reflects how active each relationship is.
- **New marketing pages** — a redesigned home page, a pricing page, a privacy policy, and terms of service, all under the Tending name.
- **Trial-ending reminder emails** — you'll now automatically receive an email a week before your trial ends, and another the day before (or the morning of, if it ends later that day).
- **Restyled transactional emails** — the sign-in link, welcome, team-invite, and trial-reminder emails all now share a consistent, branded look.

### Changed

- **Sign-in is now magic link only.** Following your sign-in link now takes you straight into your organisation rather than back to the sign-in page, and if the link has already been used or has expired you'll see a clear message explaining why, with an easy way to request a new one.
- **Following a link while signed out and returning after signing in now works properly** — for example, a bookmarked or shared link to a specific page will take you to that same page once you've signed in, instead of always landing on the homepage.
- **Subscriptions are now only confirmed once payment has actually succeeded**, and the "you're subscribed" confirmation email is sent exactly once, right after that happens.
- **Trial-ending messages now say "today"** rather than "tomorrow" when a trial is ending later the same day.
- **Simplified pricing** — a single plan at £5/month with everything included, after a 30-day free trial.
- **Expired trials are now read-only** — once a trial ends without a subscription, you can still view your organisation's settings and billing to subscribe, but adding or editing connections and moments is paused until you do.

### Removed

- **Google sign-in has been removed.** Magic link — a one-time emailed link — is now the only way to sign in; Tending never stores a password for you.

### Fixed

- Fixed how Tending's brand appears in link previews and browser tabs when a page is shared or bookmarked.
- Fixed a checkout bug that could prevent a subscription from starting correctly.

## [2026-07-06]

### Added

- Sign up, create an organisation, and invite team members with owner, admin, contributor, and viewer roles.
- Record connections (people, groups, and organisations) and moments (natural-language notes about interactions and events), and link moments to the connections they involve.
- Subscription billing with Individual, Organisation, and Large plans, including a trial period.
- **Network view** — your whole relational ecosystem shown as an interactive, explorable map, with pan, zoom, drag, hover, search, and filtering by type, strength, or unconnected status. Connections mentioned together in the same moments are linked automatically.
- **Cluster detection** — Tending automatically groups tightly-connected parts of your network and colours them accordingly.
- **Constellation view** — a bird's-eye alternative to the network map, showing whole clusters as single nodes with arcs between them.
- **Quality spectrums** — five sliders (depth, reciprocity, formality, activity, maturity) that track how each relationship feels and functions, with a history sparkline showing how they've shifted over time.
- **"Understand with AI"** — when recording a moment, Tending can read what you've written and suggest which existing connections it mentions.
- **Automatic quality updates** — after saving a moment, Tending quietly updates the relevant connections' quality spectrums based on what happened, marked with an "AI-suggested" badge so you can tell them apart from manual changes.
- **Automatic story summaries** — each connection's story is now automatically regenerated after every moment, carrying tone and continuity forward rather than just listing entries.
- **Full-text search** across moment content and connection names.
- **Spaces** — group connections around a shared project or idea, and filter your connections and moments by space.
- **Observations** — Tending periodically checks your network for dormant relationships, meaningful quality shifts, and dependency risk (where too much of your network runs through one person), and surfaces them as gentle, dismissible suggestions rather than alerts.
- **Dashboard** — a weekly view of moment activity, your most pressing observations, recent moments, and team activity.
- **River view** — a chronological stream of every moment recorded across your organisation, with author attribution and filtering by space, author, connection type, and date range.
- **Granular permissions** — admins can now grant a specific extra capability (like deleting moments, or managing members) to someone without making them a full Admin.
- **Organisation switcher** — move between organisations you belong to from the sidebar.

### Fixed

- Signing out now works — previously there was no way to sign out of your account from the app.
- The Moments page no longer 404s.
- Fixed a crash on the Search page caused by an incorrectly formatted date.
