# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

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
