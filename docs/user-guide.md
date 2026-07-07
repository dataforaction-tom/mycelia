# User Guide

This guide covers everything you need to know about using Tending.

## Signing in

Tending has no passwords. Enter your email on the sign-in page and Tending sends you a one-time link — click it and you're in. Each link works once and expires after 24 hours.

If a link has already been used or has expired (this can happen if your email provider opens it automatically to scan it), you'll see a message explaining that, with the option to request a fresh one straight away. If you followed a link to a specific page while signed out, signing in takes you back to that same page rather than dropping you at the homepage.

## Organisations

Tending is organised around **organisations** — your team's shared workspace. When you first sign in, you'll create an organisation, which gives you a unique web address (like `tending.network/your-org-name`).

When creating an organisation, you can choose to start with a small set of example data — a person, a programme, and a few moments already in place — so there's something alive to explore straight away. A short guided tour then walks you through recording a moment, your dashboard, the Network view, and observations. At the end of the tour you choose whether to keep the example data and carry on adding to it, or clear it and start with a blank organisation. You can also clear example data at any time from **Settings**, and it never affects anything your team has added itself.

### Members and roles

You can invite people to your organisation from **Settings → Members**. Each person is given a role:

- **Owner** — full control, including billing
- **Admin** — can manage members, delete connections/moments/spaces
- **Contributor** — can add and edit connections and moments
- **Viewer** — read-only access

An admin can also grant someone a specific extra permission without making them a full Admin — for example, letting a Contributor delete moments, or letting them manage members, without handing over every admin capability. This is useful when someone has a particular responsibility (like a safeguarding lead) that needs elevated access in one area only.

### Switching organisations

If you belong to more than one organisation, click your organisation's name at the top of the sidebar to switch between them, or to create a new one.

### Signing out

Click your name at the bottom of the sidebar to open the account menu, then choose **Sign out**.

## Connections

A connection is the fundamental unit in Tending — not a "contact record," but the relationship between your organisation and a person, group, or other organisation. Each connection has:

- **A story** — a living narrative built up from moments over time
- **Qualities** — descriptors that capture how the relationship feels and functions (see [Qualities](#qualities) below)
- **A position in your network** — how it connects to everything else

You can create, view, edit, and delete connections from the **Connections** section. Each connection has its own page showing its story, quality spectrums, and moment history.

Each connection's card shows a short teaser from its story and a **vitality** indicator — a quick visual sense of how alive the relationship currently is, from freshly active to quiet for a long while, based on how recently a moment was recorded for it.

## Moments

A moment is any interaction, observation, or event that becomes part of a connection's story — a conversation, an email, a meeting, a piece of news. Moments are written in natural language, not filled into rigid form fields.

You can either type a moment or speak it — tap the microphone in the composer, talk it through, and Tending transcribes what you said into the text box for you to review before saving.

As you type (or as your words are transcribed), Tending recognises the names of people, groups, and spaces you mention and shows them instantly as chips — no waiting required, since it's simply matching against who's already in your organisation. When you record a moment:

- You can link it to one or more connections, either by accepting a recognised chip or adding one yourself.
- You can set an **event date** if the moment happened at a specific point in time (rather than just "now").
- An **"Understand with AI"** panel runs alongside and can catch fuzzier mentions the instant recognition misses, and suggest an event date. This is informational only — it never creates or links anything without you choosing to.

### Automatic quality updates

Once a moment is saved, Tending automatically looks at what you wrote and updates the quality spectrums (see below) for any connections involved. These AI-suggested updates are marked with an **"AI-suggested"** badge, so you can always tell the difference between a quality you set yourself and one Tending inferred. This happens quietly in the background and never blocks or delays saving your moment.

### Automatic story updates

For any connection with two or more moments, Tending also regenerates that connection's **story summary** after each new moment — a short, coherent narrative that reads like someone who knows the relationship telling you about it, not just a list of past entries. It carries tone and continuity forward from the previous summary, so the story evolves rather than resets each time.

## Qualities

Qualities replace tags and categories. Rather than labelling a connection "donor" or "volunteer," Tending tracks how the relationship actually feels, across five spectrums:

| Spectrum | Range |
|----------|-------|
| Depth | Deepening ↔ Cooling |
| Reciprocity | Reciprocal ↔ One-directional |
| Formality | Formal ↔ Trust-based |
| Activity | Active ↔ Dormant |
| Maturity | Emerging ↔ Established |

Each connection's page shows its current position on each spectrum, along with a small history sparkline so you can see how it's shifted over time. Positions update automatically as moments are recorded, or you can set them manually.

## The Network view

The Network view shows your entire relational ecosystem as a living map, rather than a table of names. This is Tending's primary view — the idea is that the shape of your network tells you things a list never could.

- **Zoom, pan, and drag** nodes to explore.
- **Click a node** to jump straight to that connection's page.
- **Hover** over a node or connection line for a quick summary.
- **Filter** by connection type, relationship strength, or to show only unconnected people.
- **Search and centre** on a specific connection by name.

Connections that are frequently mentioned together in the same moments are automatically linked, and the strength of each link reflects how often and how recently that's happened. Nodes and threads glow brighter for relationships that are freshly active, and fade for ones that have gone quiet, so vitality is visible at a glance across the whole network.

### Clusters

Tending automatically detects clusters — tightly-connected groups within your network — and colours nodes accordingly, so you can see at a glance which parts of your ecosystem naturally group together.

### Constellation view

For a bird's-eye alternative to the full network graph, switch to **Constellation view**. Instead of individual people and organisations, it shows each cluster as a single node — sized by how many connections it contains, and brightened by how active it's been recently — with arcs showing how clusters relate to one another. This is a useful way to read the shape of a large network without the detail of every individual node.

## Spaces

Spaces let you group connections around a shared context — a project, an initiative, or an idea, rather than a person or organisation in its own right. Use spaces to tag which connections are involved in, say, a particular campaign or programme.

You can create spaces, assign connections to them, and filter your Connections and Moments views by space, from **Settings → Spaces**. The **Spaces** page gives you a browsable view of every space, each showing how many connections it holds and when it last had a moment recorded against it, so you can see where your threads are crossing.

## Search

Use **Search** to find moments by their content, or connections by name. Search looks across the full text of everything you've recorded, not just titles or tags.

## Observations

Tending periodically looks across your whole network for patterns you might not have noticed yourself, and surfaces them as gentle **observations** rather than alarms:

- **Dormant connections** — relationships that have gone quiet for longer than usual
- **Quality shifts** — a relationship that's meaningfully deepened or cooled
- **Dependency risk** — when several of your strongest relationships all run through a single person, meaning your network could be more fragile than it looks if that person left

Observations are colour-coded by how much attention they deserve (gentle, noteworthy, or important), and shown on the **Observations** page and in the **Attention** section of your dashboard. For each one, you can:

- **Dismiss** it, if it's not useful right now
- **Mark it as acted on**, optionally noting what you did about it

Click **"Check for patterns"** on the Observations page at any time to generate a fresh check.

## Dashboard

Your Dashboard gives you a weekly pulse on your organisation's relational health:

- How many moments have been recorded this week, compared to the week before
- Your most pressing **observations**, ranked by how much attention they need
- Recent moments across the whole organisation
- Team activity — who on your team has been recording moments, over the last 30 days

## River view

The **Moments** page (sometimes called the River view) shows every moment recorded across your organisation as a chronological stream, with the author of each one shown alongside it. You can filter by space, author, connection type, or a date range to narrow the stream down to exactly what you're looking for.

## Billing

Tending has one plan: £5 a month with everything included, after a 30-day free trial that needs no card to start. Manage your subscription and view invoices from **Settings → Billing**.

You'll get a reminder email a week before your trial ends, and another the day before (or that same morning, if it's ending later today). If a trial runs out without a subscription, your organisation becomes **read-only** — you can still sign in, view everything, and reach Settings and Billing to subscribe, but adding or editing connections and moments is paused until you do. Your subscription is only confirmed once payment has actually gone through, and you'll get a confirmation email at that point.
