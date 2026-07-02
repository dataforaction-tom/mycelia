# Mycelium

## Product Specification v1.0

**A relationship management system for social purpose organisations.**

*Every other CRM asks "what do you need to know about your contacts?" Mycelium asks "what do your relationships need from you?"*

The Good Ship | February 2026

---

## Contents

1. Vision & Philosophy
2. Core Concepts
3. The Four Layers
4. Use Cases & User Journeys
5. Information Architecture
6. Views & Interfaces
7. AI Architecture
8. Migration & Onboarding
9. Privacy Architecture
10. Technical Architecture
11. Authentication & Permissions
12. Security & Testing
13. Pricing & Payment
14. Integration with Drift, Undercurrent & Glade
15. Build Phases
16. Open Questions

---

## 1. Vision & Philosophy

### The problem with CRMs

The language gives it away. **Customer Relationship Management** assumes:

- Relationships are transactional (customers)
- Relationships need managing (control sits with you)
- The unit of value is the individual record (a row in a database)
- The goal is extraction (what can we get from this person?)

For organisations whose work is built on trust, reciprocity, and long-term commitment to communities, this metaphor is actively harmful. It trains people to think of relationships as things to be tracked, contacts to be managed, pipelines to be progressed.

The result: organisations use spreadsheets, because at least a spreadsheet doesn't impose a worldview. Or they buy Salesforce and use 8% of it. Or they use nothing and rely on institutional memory that walks out the door when someone leaves.

### What Mycelium believes

Mycelium is named after the underground fungal network that connects a forest. Invisible, essential, reciprocal. Nutrients flow in multiple directions. The network is the intelligence, not any single node.

**Relationships are not records. They're living narratives.** Every interaction is a moment in an ongoing story. The system should help you understand that story, not flatten it into fields.

**Connections have qualities, not just categories.** "Donor" and "volunteer" are static labels. The reality is that relationships deepen, cool, shift, go dormant, reactivate. A relationship can be reciprocal or one-directional, formal or trust-based, deepening or at risk. These qualities matter more than any tag.

**The network is the primary view.** Not a table of contacts. You open Mycelium and you see a living map of your relational ecosystem. Clusters, bridges, gaps. The structural insight lives here: where are you connected, where are you blind, what happens if one person leaves?

**People hold their own end of the thread.** The people in your network are not passive records. They have agency. They can update their own story, signal what they need, set boundaries on what you know about them. The relationship becomes actually mutual.

**The system should surface what you're not seeing.** Who's drifting? Which communities are underrepresented? Where are structural holes? What patterns are emerging across your relational ecosystem? These are the insights that live in someone's gut feeling today but never get surfaced systematically.

### Design metaphor

Mycelium uses a **garden metaphor** rather than a pipeline metaphor. Relationships don't progress through stages — they ebb, flow, go dormant, reactivate, branch, and intertwine. The language throughout the product reflects this: you **nurture** connections, observe **seasons** in relationships, notice what's **growing** and what needs **attention**.

---

## 2. Core Concepts

### Connection

The fundamental unit. A connection is not a contact record — it's the relationship between your organisation and a person, group, or other organisation. A connection has:

- **A story**: a living narrative of the relationship, built from moments over time
- **Qualities**: descriptors that capture the texture of the relationship (not static categories)
- **A network position**: how this connection relates to others in your ecosystem
- **Agency**: both sides can contribute to and shape the connection

### Qualities

Qualities replace tags and categories. They are fluid descriptors that capture how a relationship feels and functions, not what box it fits in. Qualities exist on spectrums:

| Spectrum | Description |
|----------|-------------|
| Deepening ↔ Cooling | Is the relationship growing stronger or fading? |
| Reciprocal ↔ One-directional | Does value flow both ways? |
| Formal ↔ Trust-based | Is the connection institutional or personal? |
| Active ↔ Dormant | Is there current energy, or is it resting? |
| Emerging ↔ Established | How mature is the relationship? |

Qualities shift over time. The system tracks these shifts, creating a sense of movement and direction in the relationship.

Organisations can define their own quality spectrums. The defaults above are starting points, not constraints.

### Moments

A moment is any interaction, observation, or event that becomes part of a connection's story. Moments are entered in natural language — not as form fields. A moment might be:

- "Had coffee with Sarah — she's worried about funding for the winter programme"
- "Three people from the Byker group came to the open day. First time we've had anyone from that area."
- "Board decided to end the partnership with [org]. Amicable but sad."
- An email, a meeting note, a photograph, a voice memo

Moments carry context: who was involved, what qualities they reveal, what connections they strengthen or surface.

### Threads

A thread is the narrative arc of a connection over time. Moments weave into threads. AI assists in synthesising threads into coherent stories:

*"Sarah first connected with us through the winter programme in 2023. She came back as a volunteer six months later. Over the past year, the relationship has deepened — she's now co-designing the peer support offer and has introduced us to three other community leaders in her area."*

This isn't a log. It's understanding.

### Network

The network is the totality of connections and the relationships between them. It is the primary analytical lens. The network reveals:

- **Clusters**: groups of densely connected people (communities, teams, geographies)
- **Bridges**: people who connect otherwise separate clusters (invaluable, vulnerable)
- **Gaps**: communities, geographies, or demographics with weak or absent connections
- **Dependencies**: single points of failure where too much flows through one person
- **Patterns**: emergent signals across the relational ecosystem

---

## 3. The Four Layers

Mycelium is designed in layers. Each is optional. Each adds value. You never have to go deeper than feels right. The simple thing is the whole thing, not a dumbed-down version of the complex thing.

### Layer 1: Natural Language Entry

*"Who matters to your organisation?"*

You open Mycelium for the first time. No setup wizard. No field configuration. No "define your pipeline stages." There's a prompt. You type naturally:

> "Sarah runs the community centre on Park Road. We've worked with her on three projects and she's brilliant at getting people through the door."

The system understands this. It creates a connection with qualities already embedded (active, reciprocal, established, trust-based). It infers a link to the community centre. It notes the three projects. That's your CRM on day one. It's already more useful than a spreadsheet.

**Entry methods:**
- Text (primary): natural language input via text field
- Voice: speak a moment, transcribed and processed
- Photo: attach an image to a moment (event photo, whiteboard, document)
- Email forward: forward a relevant email, system extracts the moment
- Quick capture: mobile-first minimal input for noting something in the moment

### Layer 2: Network Emerges

As you add more connections, the map starts to populate. You didn't configure it. You didn't draw the lines. The system inferred them from your stories.

Sarah is connected to the community centre. The community centre is connected to the neighbourhood. The neighbourhood has five other people in it. Clusters form organically. Gaps become visible without anyone building a report.

At this layer, the value is **seeing your relational ecosystem for the first time** as a living map rather than a list.

### Layer 3: Pattern Recognition

After a few weeks of use, Mycelium begins offering gentle observations. Not alerts — observations. The tone is curious, not urgent:

- "You haven't mentioned anyone from Byker in a while."
- "Three of your strongest relationships are all connected to one person — what happens if they move on?"
- "This funder relationship has been one-directional for 18 months — you're giving updates but never asking for anything beyond money. Is that intentional?"
- "Three people from different areas all mentioned transport barriers this month."

You can ignore these, reflect on them, or let them prompt action. The system learns from your responses which observations you find valuable.

### Layer 4: Mutual Connections

When you're ready, you can invite people to hold their own end of the thread. A simple, beautiful link (Drift-style) where someone can:

- Tell you what they want from the relationship
- Update their own context ("I've moved roles", "I'm taking a break from volunteering")
- Set boundaries on what you know about them
- Signal needs ("We're looking for partners on X")
- See what you know about them (transparency)

The relationship becomes genuinely two-directional. This is the piece no existing CRM offers.

---

## 4. Use Cases & User Journeys

### Small community organisation (5 staff, ~200 connections)

**Current state:** Contacts in a shared spreadsheet, some in people's email, some in nobody's head. When the community development worker left, half the relationships went with them.

**Mycelium entry:** Manager sits down and starts telling Mycelium about the people who matter. Within an hour, 30 connections are in the system with real stories attached. The network view reveals something they hadn't articulated: all their community connections flow through two people.

**6 months later:** 150 connections, three clusters visible (geographic communities they serve), one clear gap (a neighbourhood they thought they were reaching but have only one weak connection to). Pattern recognition flags that their main funder hasn't heard from them in a way that isn't a report for 8 months.

### Medium organisation running programmes (20 staff, ~1,500 connections)

**Current state:** Salesforce instance they hate. Three people know how to use it. Everyone else uses their own spreadsheet or notebook.

**Mycelium entry:** AI-assisted migration from their Salesforce export. The conversation reveals that "partner" means four different things to four different teams. The migration becomes a clarity exercise. Teams start adding moments from their own work.

**6 months later:** Network view shows how their three programmes connect through shared community relationships. A bridge person connecting two previously separate programme communities is identified — they invite this person to Layer 4, and she starts actively shaping the connection.

### Network or coalition (3 staff, ~80 member organisations, ~500 individual connections)

**Current state:** A membership database that tracks who's paid their subscription. No understanding of the relationships between members, or between members and the communities they serve.

**Mycelium entry:** Start with the 80 member organisations as connections. Add stories about each. The network view immediately shows which members are connected to each other and which are isolated. Gaps in geographic coverage become visible.

**6 months later:** Member organisations are invited to Layer 4. Some update their own context. The coalition can see, for the first time, the actual network of relationships across their membership — not just who's a member, but how the ecosystem connects.

---

## 5. Information Architecture

### Entities

```
Organisation (tenant)
├── Spaces (optional grouping — by team, programme, geography)
│   ├── Connections
│   │   ├── Moments (natural language entries with metadata)
│   │   ├── Qualities (spectrum positions, tracked over time)
│   │   ├── Thread (AI-synthesised narrative)
│   │   └── Mutual Profile (Layer 4, controlled by the other party)
│   ├── Clusters (auto-detected or manually defined)
│   └── Observations (system-generated pattern insights)
├── Network (aggregate view across all spaces)
└── Settings & Permissions
```

### Spaces

Spaces are optional containers. A small organisation might use a single space. A larger one might have spaces for different teams, programmes, or geographies. Connections can belong to multiple spaces. The network view can show one space or all.

Spaces are deliberately not called "teams" or "departments" — they're flexible containers that organisations define for themselves.

### Connection record

A connection holds:

| Field | Type | Notes |
|-------|------|-------|
| Name | Text | Person, organisation, or group name |
| Type | Enum | Person, Organisation, Group, Community |
| Story | Generated | AI-synthesised thread from moments |
| Qualities | Quality[] | Current spectrum positions |
| Quality history | QualityChange[] | How qualities have shifted over time |
| Moments | Moment[] | Chronological interactions and observations |
| Network links | Connection[] | Inferred and explicit connections to others |
| Mutual profile | MutualProfile? | Layer 4: their self-managed information |
| Spaces | Space[] | Which spaces this connection belongs to |
| Created | DateTime | When first added |
| Last moment | DateTime | When the most recent moment was recorded |
| Attention signals | Signal[] | System observations about this connection |

### Moment record

| Field | Type | Notes |
|-------|------|-------|
| Content | Text | Natural language entry |
| Source | Enum | Manual, Voice, Email, Photo, Quick capture |
| Attachments | File[] | Images, documents, voice memos |
| Connections mentioned | Connection[] | Auto-detected or tagged |
| Qualities revealed | QualitySignal[] | What this moment says about relationship quality |
| Author | User | Who recorded this |
| Space | Space | Context of observation |
| Timestamp | DateTime | When recorded (can differ from event time) |
| Event date | DateTime? | When the moment actually happened |

---

## 6. Views & Interfaces

### Visual Language

Mycelium's aesthetic follows The Good Ship's organic design language. Warm, natural, alive. The interface should feel like tending a garden, not operating a machine.

**Colour palette:**
- Primary: warm earth tones (terracotta, moss, bark)
- Secondary: soft greens, warm greys
- Accent: amber for attention signals, soft blue for mutual/reciprocal
- Background: warm cream, not clinical white
- Network nodes: colour-coded by cluster with natural palette

**Typography:**
- DM Sans for interface elements
- System serif for narrative text (threads, stories)
- Generous whitespace, readable line lengths

**Animation:**
- Network: nodes breathe gently, connections pulse softly when recently active
- Moments: flow in like water (consistent with Drift aesthetic)
- Transitions: organic easing curves, nothing mechanical

### Network View (primary)

The default view on login. A force-directed graph showing the organisation's relational ecosystem.

**Elements:**
- **Nodes**: sized by connection strength (quality density × moment frequency)
- **Edges**: styled by relationship quality (thick/warm for strong, thin/cool for weak, dashed for dormant)
- **Clusters**: visually grouped with soft boundary shading
- **Gaps**: empty areas highlighted with subtle attention markers
- **Bridges**: connecting nodes emphasised (they're structurally important)
- **Attention signals**: amber indicators on connections that need care

**Interactions:**
- Click node: opens connection detail panel (story, qualities, recent moments)
- Hover node: shows name, key quality, last moment date
- Drag to explore: pan and zoom the network
- Filter by space, quality spectrum, time range
- Toggle: show/hide dormant connections
- Search: find a connection, centre the network on them

**Zoom levels:**
- Zoomed out: cluster-level view, see the shape of your network
- Mid: individual connections visible, names appear
- Zoomed in: connection detail with recent moments visible

### Story View

The narrative view of a single connection. Not a timeline of events — a coherent story.

**Components:**
- **Thread**: AI-generated narrative summary at the top, updated as new moments are added
- **Quality indicators**: current spectrum positions shown visually (not as data, as gentle indicators)
- **Quality arc**: how qualities have shifted over time (a flowing line, not a bar chart)
- **Moments stream**: chronological moments flowing downward, each with content, source, attachments
- **Network context**: small network view showing this connection's immediate neighbourhood
- **Mutual section** (Layer 4): what the other party has shared, clearly separated from your observations

### River View

A chronological stream of all moments across the organisation, flowing like a river. Inspired by Undercurrent's river view.

**Elements:**
- Moments flow in reverse chronological order
- Each moment shows: author, connection(s), content preview, source icon
- Moments cluster by connection when multiple are close in time
- Filter by space, author, connection type, date range
- Pattern highlights: when the system notices a pattern across recent moments, it's marked subtly

### Constellation View

An alternative network visualisation focusing on clusters and their relationships. Better for organisations with many connections where the force-directed view becomes dense.

**Elements:**
- Clusters shown as constellations (grouped points connected by lines)
- Inter-cluster connections shown as arcs
- Brightness indicates activity level
- Size indicates connection count
- Hover reveals cluster composition

### Dashboard

A summary view for checking in. Not the primary interface — the network view is — but useful for routine monitoring.

**Components:**
- **Ecosystem pulse**: overall activity level, trend direction
- **Attention list**: connections and patterns that need care (ordered by urgency, gentle tone)
- **Recent moments**: latest activity stream
- **Quality shifts**: connections where qualities have changed recently
- **Gap alerts**: communities or areas with weakening connections
- **Team activity**: who's been recording moments (not as surveillance — as awareness)

### Mobile Experience

Mobile is primarily a capture device. The most important mobile action is recording a moment — you've just had a conversation, you're at an event, you want to note something before you forget.

**Mobile-first features:**
- Quick capture: one-tap to start recording a moment
- Voice input: speak the moment, transcribed and processed
- Photo attachment: snap and attach
- Network view: simplified, touch-optimised
- Connection lookup: quick search to see a story before a meeting

---

## 7. AI Architecture

### Provider-Agnostic Infrastructure

Mycelium uses the Vercel AI SDK with a registry pattern, consistent with Drift, Undercurrent, and Glade.

```typescript
// Provider registry
const registry = {
  providers: {
    anthropic: { models: ['claude-sonnet-4-20250514'] },
    openai: { models: ['gpt-4o', 'gpt-4o-mini'] },
    google: { models: ['gemini-2.0-flash'] }
  }
};

// Task-to-provider mapping (configurable without code changes)
const taskConfig = {
  'moment-understanding': { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
  'thread-synthesis': { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
  'pattern-recognition': { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
  'migration-conversation': { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
  'quality-inference': { provider: 'openai', model: 'gpt-4o-mini' },
  'quick-extraction': { provider: 'google', model: 'gemini-2.0-flash' }
};
```

**Principles:**
- No provider lock-in: any task can switch provider via config
- Automatic failover: if primary provider fails, fall back to secondary
- Cost tracking: per provider, per model, per task, per space
- Rate limiting: per-organisation, respecting plan limits
- Streaming: all user-facing AI responses stream in real-time

### AI Features by Layer

**Layer 1 — Moment Understanding:**
- Parse natural language moments into structured data
- Extract connections mentioned (existing or new)
- Infer quality signals from language
- Detect event dates vs recording dates
- Suggest connections between people mentioned together

**Layer 2 — Network Inference:**
- Infer connections between people based on co-mention and context
- Detect clusters from relationship patterns
- Identify bridges and structural roles
- Calculate network position metrics
- Generate cluster labels from shared qualities

**Layer 3 — Pattern Recognition:**
- Surface dormant connections (no moments for X weeks)
- Identify single-point dependencies
- Detect quality shifts across the network
- Find cross-connection themes (multiple people mentioning same issue)
- Generate gentle observation messages
- Learn from user responses: which observations prompt action?

**Layer 4 — Mutual Understanding:**
- Match self-reported information with organisational observations
- Flag discrepancies gently (not as errors — as conversation starters)
- Suggest conversation topics based on mutual signals
- Translate between organisational language and personal language

**Thread Synthesis:**
- Generate narrative summaries from moment sequences
- Update threads incrementally as new moments arrive
- Maintain consistent voice and tone
- Highlight turning points in the relationship
- Generate "relationship health" summaries for dashboards

### AI Safety & Ethics

- All AI outputs clearly marked as AI-generated
- Users can edit, reject, or override any AI inference
- Quality inferences are suggestions until confirmed
- Pattern observations are framed as questions, not assertions
- No automated actions: AI observes and suggests, humans decide
- Sensitive content handling: moments mentioning safeguarding concerns flagged for human review, never processed for pattern recognition
- Data never used for model training
- AI explanations available: "Why are you showing me this?"

---

## 8. Migration & Onboarding

### The Conversation, Not the Import

Traditional CRM migration is a data mapping exercise: match your columns to our fields. This is wrong for Mycelium because the output shouldn't be a cleaner database — it should be a living network of understood relationships.

### AI-Assisted Migration Flow

**Step 1: Upload**

User uploads their existing data. Supported formats:
- CSV/Excel spreadsheets (the most common)
- Salesforce export
- Airtable export
- Google Contacts export
- Mailchimp export
- Plain text / notes documents

**Step 2: Conversation**

The AI reads the data and has a conversation about it. Not "which column maps to which field" but:

- "It looks like you've got about 40 people tagged as 'partner' — what does partner mean to you?"
- "There are 15 people you haven't contacted in over a year — are these dormant relationships or ones that have ended?"
- "I notice three different spellings of what might be the same organisation — shall I merge them?"
- "The notes column has some rich detail. For Sarah, it says 'introduced us to the Byker group, really key person.' That sounds like a bridge connection — would you agree?"
- "You've got 300 rows but some look like duplicates. Want me to show you what I think are the same person?"

The user responds naturally. The AI uses responses to build understanding, not just clean data.

**Step 3: Network Generation**

From the conversation, the AI generates:
- Connections with initial stories (based on available data and conversation context)
- Quality inferences (marked as provisional until confirmed)
- Network map with inferred clusters
- A list of "I couldn't figure this out — can you help?" items

**Step 4: Refinement**

User reviews the generated network. Confirms or corrects quality inferences. Adds missing connections. Merges remaining duplicates. The result is a living network map, not a cleaner database.

### Fresh Start Onboarding

For organisations with no existing data (or who want a clean start):

1. "Tell us about one relationship that matters to your organisation."
2. System creates the first connection with full story and qualities.
3. "Who else comes to mind?" — gentle prompting to add more.
4. After ~10 connections, show the emerging network view. "Look — you can already see a pattern."
5. Introduce quality spectrums: "How would you describe this relationship?"
6. At ~30 connections, first pattern observations appear.

The onboarding is the product. There's no difference between "setting up" and "using" Mycelium.

---

## 9. Privacy Architecture

### Principles

**1. Consent is granular and ongoing, not a one-time tick box.**

When someone joins the mutual layer (Layer 4), they choose what's visible, what's shared, and what's private. They can change these settings at any time. This is not GDPR compliance theatre — it's genuine relationship respect.

**2. There is a clear distinction between "about you" and "about us."**

| Information type | Owned by | Example |
|-----------------|----------|---------|
| Your observations | Your organisation | "I think this relationship is cooling" |
| Their shared information | Them | "I've moved to a new role" |
| Connection existence and qualities | Shared | "We have a relationship; it's collaborative" |
| Internal assessments | Your organisation | "Key stakeholder for the winter programme" |
| Safeguarding information | Governed by policy | See below |

Making these distinctions explicit and visible in the interface is essential.

**3. Safeguarding creates a legitimate exception, and that exception is transparent.**

In contexts where an organisation holds information for someone's protection (or others'), the system supports that — but it is not hidden.

"We hold some information that we can't share or delete for safeguarding reasons."

The system helps organisations navigate this with care:
- Safeguarding-tagged information is stored with explicit justification
- Retention periods are defined and enforced
- Access is restricted to designated safeguarding leads
- The person can see *that* information is held, even if they can't see *what* it is
- Regular review prompts ensure safeguarding data doesn't persist beyond its purpose

**4. The default is minimal.**

Mycelium holds the least amount of information needed to nurture the relationship. This is counter to every CRM instinct (capture everything!) but it is the right ethical stance. Most organisations don't need or use 80% of what they collect.

- New connections start with minimal data
- The system never prompts "fill in these empty fields"
- Instead: "What do you know about this relationship that matters?"
- Data retention policies are configurable per space
- Dormant connections can be automatically anonymised after a defined period

### Data Rights

People in the network (whether at Layer 4 or not) have rights:

| Right | Implementation |
|-------|---------------|
| Right to know | Layer 4 users can see what's held about them |
| Right to correct | Layer 4 users can update their own information |
| Right to delete | Request deletion (subject to safeguarding exceptions) |
| Right to restrict | Set boundaries on what's collected and shared |
| Right to portability | Export their side of the connection data |
| Right to object | Opt out of AI processing |

### Technical Implementation

- All personal data encrypted at rest (AES-256)
- Mutual layer data stored in a separate, permission-gated schema
- Safeguarding data in an additional isolated schema with audit logging
- All data access logged for accountability
- GDPR-compliant deletion: cascade through moments, qualities, threads
- Data residency: UK/EU (Neon London region, Vercel LHR edge)
- Regular automated privacy audits: flag data that exceeds retention policies

---

## 10. Technical Architecture

### Stack

| Layer | Technology | Region | Notes |
|-------|-----------|--------|-------|
| Framework | Next.js 15 (App Router) | — | Consistent with Drift, Undercurrent, Glade |
| Hosting | Vercel | LHR edge | UK-primary |
| Database | Neon Postgres | London (eu-west-2) | Serverless, branching for dev |
| ORM | Drizzle | — | Type-safe queries |
| Auth | NextAuth v5 | — | See Section 11 |
| AI | Vercel AI SDK | — | Provider-agnostic registry |
| Real-time | Ably or Pusher | — | Network view updates, collaboration |
| Media storage | AWS S3 / Cloudflare R2 | EU | Moment attachments |
| Email | Resend | — | Notifications, invitations |
| Payments | Stripe Billing | — | Subscriptions, metered billing |
| Search | Neon + pgvector | London | Semantic search across moments |
| Monitoring | Sentry + PostHog | EU | Error tracking, product analytics |
| CI/CD | GitHub Actions | — | Automated testing, deployment |

### Database Schema (Core)

```sql
-- Organisations (tenants)
CREATE TABLE organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan plan_type NOT NULL DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Spaces (optional grouping within organisations)
CREATE TABLE spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Connections (the core entity)
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type connection_type NOT NULL DEFAULT 'person',
  thread_summary TEXT, -- AI-generated narrative
  thread_updated_at TIMESTAMPTZ,
  mutual_profile_id UUID, -- link to mutual layer
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Connection-Space membership (many-to-many)
CREATE TABLE connection_spaces (
  connection_id UUID REFERENCES connections(id) ON DELETE CASCADE,
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  PRIMARY KEY (connection_id, space_id)
);

-- Moments (interactions and observations)
CREATE TABLE moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  source moment_source NOT NULL DEFAULT 'manual',
  event_date TIMESTAMPTZ,
  attachments JSONB DEFAULT '[]',
  ai_extraction JSONB DEFAULT '{}', -- extracted entities, inferred qualities
  space_id UUID REFERENCES spaces(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Moment-Connection links (a moment can mention multiple connections)
CREATE TABLE moment_connections (
  moment_id UUID REFERENCES moments(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES connections(id) ON DELETE CASCADE,
  PRIMARY KEY (moment_id, connection_id)
);

-- Qualities (spectrum positions over time)
CREATE TABLE qualities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES connections(id) ON DELETE CASCADE,
  spectrum TEXT NOT NULL, -- e.g. 'depth', 'reciprocity', 'formality'
  position FLOAT NOT NULL, -- -1.0 to 1.0
  confidence FLOAT NOT NULL DEFAULT 0.5, -- AI confidence
  source quality_source NOT NULL DEFAULT 'inferred', -- inferred, confirmed, manual
  moment_id UUID REFERENCES moments(id), -- which moment informed this
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Network links (relationships between connections)
CREATE TABLE network_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  source_connection_id UUID REFERENCES connections(id) ON DELETE CASCADE,
  target_connection_id UUID REFERENCES connections(id) ON DELETE CASCADE,
  strength FLOAT DEFAULT 0.5,
  source link_source NOT NULL DEFAULT 'inferred', -- inferred, confirmed, manual
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_connection_id, target_connection_id)
);

-- Observations (AI-generated pattern insights)
CREATE TABLE observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  type observation_type NOT NULL,
  content TEXT NOT NULL,
  connections UUID[] DEFAULT '{}', -- related connection IDs
  severity observation_severity DEFAULT 'gentle',
  status observation_status DEFAULT 'new',
  user_response TEXT, -- how the user engaged with this observation
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Mutual profiles (Layer 4 - controlled by the other party)
CREATE TABLE mutual_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES connections(id) ON DELETE CASCADE,
  email TEXT,
  token TEXT UNIQUE NOT NULL, -- access token for the mutual link
  display_name TEXT,
  shared_context TEXT, -- what they choose to share
  boundaries JSONB DEFAULT '{}', -- their consent settings
  needs TEXT, -- what they're looking for
  last_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Safeguarding records (isolated, audit-logged)
CREATE TABLE safeguarding_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES connections(id),
  organisation_id UUID REFERENCES organisations(id),
  content_encrypted BYTEA NOT NULL, -- encrypted at application layer
  justification TEXT NOT NULL,
  retention_until TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Semantic search vectors
CREATE TABLE moment_embeddings (
  moment_id UUID PRIMARY KEY REFERENCES moments(id) ON DELETE CASCADE,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enums
CREATE TYPE plan_type AS ENUM ('trial', 'individual', 'organisation', 'large');
CREATE TYPE connection_type AS ENUM ('person', 'organisation', 'group', 'community');
CREATE TYPE moment_source AS ENUM ('manual', 'voice', 'email', 'photo', 'quick_capture');
CREATE TYPE quality_source AS ENUM ('inferred', 'confirmed', 'manual');
CREATE TYPE link_source AS ENUM ('inferred', 'confirmed', 'manual');
CREATE TYPE observation_type AS ENUM ('dormant', 'dependency', 'gap', 'theme', 'quality_shift', 'bridge_risk');
CREATE TYPE observation_severity AS ENUM ('gentle', 'noteworthy', 'important');
CREATE TYPE observation_status AS ENUM ('new', 'seen', 'acted_on', 'dismissed');
```

### API Routes

```
/api/auth/*                    NextAuth routes
/api/organisations/*           Org CRUD, settings
/api/spaces/*                  Space management
/api/connections/*             Connection CRUD, search, network data
/api/connections/[id]/story    Thread/narrative for a connection
/api/connections/[id]/mutual   Mutual profile management
/api/moments/*                 Moment CRUD, attachment upload
/api/network/*                 Network graph data, cluster detection
/api/network/analysis          Pattern recognition, gap analysis
/api/observations/*            AI observations, user responses
/api/migration/*               Upload, conversation, generation
/api/search/*                  Semantic search across moments
/api/ai/*                      AI task endpoints (streaming)
/api/admin/*                   Super admin endpoints
/api/stripe/*                  Webhook handler, billing portal
/api/mutual/[token]/*          Public mutual profile endpoints
```

### Network Graph Engine

The network view requires a performant graph computation layer:

- **Server**: Neon + pgvector for storage, graph algorithms in SQL (recursive CTEs for path finding, materialized views for cluster metrics)
- **Client**: D3.js force-directed simulation with WebGL rendering for large networks (>500 nodes)
- **Real-time**: Incremental updates via Ably when new moments create or strengthen links
- **Caching**: Pre-computed network metrics updated on moment creation, served from Vercel KV

**Performance targets:**
- Network view initial load: <2s for 500 connections
- Moment to network update: <5s
- Pattern recognition batch: runs nightly for organisations >100 connections, real-time for smaller

---

## 11. Authentication & Permissions

### NextAuth v5 Configuration

```typescript
// auth.ts
import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import Google from 'next-auth/providers/google';
import Email from 'next-auth/providers/email';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    Google({ clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }),
    Email({ server: env.EMAIL_SERVER, from: env.EMAIL_FROM }),
  ],
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.platformRole = user.platformRole;
        token.organisationMemberships = user.organisationMemberships;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.platformRole = token.platformRole;
      session.user.organisationMemberships = token.organisationMemberships;
      return session;
    }
  }
});
```

### User Model

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  email_verified TIMESTAMPTZ,
  image TEXT,
  platform_role platform_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE organisation_memberships (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  role org_role NOT NULL DEFAULT 'viewer',
  permissions INTEGER NOT NULL DEFAULT 0, -- bitmask overrides
  invited_by UUID REFERENCES users(id),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, organisation_id)
);

CREATE TYPE platform_role AS ENUM ('super_admin', 'user');
CREATE TYPE org_role AS ENUM ('owner', 'admin', 'contributor', 'viewer');
```

### Platform Roles

| Role | Description |
|------|-------------|
| Super Admin | Full platform control. Can access any organisation, manage billing, feature flags, impersonate users. |
| User | Standard platform user. Access governed by organisation memberships. |

### Organisation Roles

| Role | Connections | Moments | Network | Observations | Settings | Members | Billing |
|------|------------|---------|---------|-------------|----------|---------|---------|
| Owner | Full | Full | Full | Full | Full | Full | Full |
| Admin | Full | Full | Full | Full | Edit | Invite/remove | View |
| Contributor | Create/edit own | Create/edit own | View | View | — | — | — |
| Viewer | View | View | View | View | — | — | — |

**Bitmask overrides** allow fine-grained exceptions. For example, a Contributor who is also a safeguarding lead gets elevated access to safeguarding records via bitmask, without being made Admin.

### Super Admin Dashboard

A separate, dense interface for platform operations. Distinct from the warm public interface.

**Capabilities:**
- **Organisation management**: view all organisations, their plan status, usage metrics, connection counts
- **User management**: search users, view memberships, reset passwords, manage platform roles
- **Impersonation**: view any organisation as any user role (logged, time-limited, read-only by default)
- **Feature flags**: toggle features per organisation or globally (new AI features, Layer 4, etc.)
- **Billing oversight**: subscription status, failed payments, trial expirations, revenue metrics
- **System health**: API latency, AI task queue, error rates, storage usage
- **Audit trail**: all admin actions logged with timestamp, actor, and justification

**Impersonation rules:**
- Every impersonation session is logged with reason
- Default: read-only (can view but not modify)
- Write access requires secondary confirmation
- Maximum session: 1 hour, auto-expires
- User is never notified of impersonation (but audit trail is permanent)

---

## 12. Security & Testing

### Security

**Session security:**
- JWT with short expiry (15 minutes), refresh token rotation
- HttpOnly, Secure, SameSite=Strict cookies
- Session invalidation on password change or suspicious activity

**API hardening:**
- Rate limiting per organisation (configurable by plan)
- Input validation with Zod schemas on every endpoint
- CSRF protection on all mutation routes
- Content Security Policy headers
- SQL injection prevention via Drizzle parameterised queries

**Data encryption:**
- At rest: Neon's built-in encryption (AES-256)
- Safeguarding records: additional application-layer encryption
- In transit: TLS 1.3 everywhere
- Mutual profile tokens: hashed with bcrypt

**Access control:**
- Middleware-based permission checking on every API route
- Row-level security: organisation_id checked on every query
- Safeguarding records: additional role check (safeguarding lead only)
- Mutual profile: token-based access, rate-limited

```typescript
// Middleware pattern
export async function withPermission(
  req: Request,
  organisationId: string,
  requiredRole: OrgRole,
  handler: () => Promise<Response>
) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const membership = await getMembership(session.user.id, organisationId);
  if (!membership || !hasRole(membership.role, requiredRole)) return forbidden();

  return handler();
}
```

**Audit trail:**
- All data mutations logged (who, what, when, from where)
- Safeguarding access logged separately with mandatory justification
- Super admin actions logged with reason
- Audit logs immutable (append-only table)
- Retention: 7 years for safeguarding, 2 years for general

### Testing Strategy

**Unit tests (Vitest):**
- Target: 80% coverage, 95% on critical paths (auth, permissions, safeguarding, billing)
- AI task parsers: test moment understanding, quality inference, thread synthesis with recorded responses
- Permission logic: exhaustive matrix testing for all role × action combinations
- Quality spectrum calculations
- Network link inference logic
- Estimated count: ~400 tests

**Integration tests (Vitest + Neon branches):**
- Database operations against real Neon branch (created per test run, destroyed after)
- API route testing with authenticated sessions
- Stripe webhook handling with test events
- AI pipeline integration with recorded responses
- Migration conversation flow
- Estimated count: ~150 tests

**End-to-end tests (Playwright):**
- Critical user journeys: onboarding, adding a moment, viewing network, inviting mutual connection
- Migration flow: upload → conversation → network generation
- Billing: trial → subscribe → upgrade → cancel
- Accessibility: axe-core integrated into every E2E test
- Mobile viewports: capture flow, network view (simplified)
- Estimated count: ~40 tests

**Security tests:**
- Authentication bypass attempts
- Cross-organisation data access attempts
- Safeguarding record access without appropriate role
- Mutual profile token enumeration
- Rate limit enforcement
- Input validation (XSS, injection)
- CORS configuration
- Estimated count: ~30 tests

**AI pipeline tests:**
- Recorded response testing (mock provider responses for deterministic tests)
- Provider failover testing
- Rate limit handling
- Streaming response handling
- Sensitive content detection
- Quality inference accuracy against labelled test set

---

## 13. Pricing & Payment

### Plans

| | Individual | Organisation | Large |
|---|---|---|---|
| **Price** | £5/month | £25/month | £50/month |
| **Users** | 1 | Up to 10 | Up to 25 |
| **Additional users** | — | — | £2/user/month |
| **Connections** | 200 | 1,000 | Unlimited |
| **Spaces** | 1 | 5 | Unlimited |
| **Moments/month** | 500 | 5,000 | Unlimited |
| **AI features** | Layer 1-2 | Layer 1-3 | All layers |
| **Mutual connections (Layer 4)** | — | 50 | Unlimited |
| **Migration assistant** | Basic (CSV only) | Full (all formats) | Full + dedicated support |
| **Pattern recognition** | — | ✓ | ✓ |
| **Network export** | — | ✓ | ✓ |
| **API access** | — | — | ✓ |
| **Safeguarding module** | — | ✓ | ✓ |
| **Priority support** | — | — | ✓ |
| **Custom quality spectrums** | — | ✓ | ✓ |

**Trial:** 30 days, full Organisation-tier features. No credit card required. At trial end, organisations choose a plan or data is retained (read-only) for 90 days before deletion.

**Annual billing:** 2 months free (shown as monthly equivalent with savings badge).

**Enterprise:** "Talk to us" — for organisations needing SSO, custom data residency, SLA, or white-labelling.

### Stripe Integration

```typescript
// Subscription lifecycle
const subscriptionConfig = {
  individual: { priceId: 'price_individual_monthly', quantity: 1 },
  organisation: { priceId: 'price_organisation_monthly', quantity: 1 },
  large: {
    priceId: 'price_large_monthly',
    quantity: 1,
    meteredItem: { priceId: 'price_large_additional_users', unit: 'user' }
  }
};
```

**Webhook handling:**
- `customer.subscription.created` → activate plan
- `customer.subscription.updated` → plan change
- `customer.subscription.deleted` → downgrade to read-only
- `invoice.payment_failed` → grace period (7 days), then restrict
- `invoice.paid` → clear any restrictions

**Metered billing (Large plan):**
- Users 1-25: included in base price
- Users 26+: £2/user/month, reported to Stripe via usage records
- Usage checked daily, reported at billing cycle end

**Trial-to-conversion flow:**
1. Sign up → 30-day trial starts (Organisation features)
2. Day 7: gentle email — "Here's what you've built so far" (connection count, network stats)
3. Day 21: email — "Your trial ends in 9 days. Here's your plan recommendation" (based on usage)
4. Day 28: email — "2 days left. Choose a plan to keep your network alive"
5. Day 30: trial ends → choose plan or enter read-only grace period
6. Day 120: grace period ends → data deletion (with 14-day warning)

---

## 14. Integration with Drift, Undercurrent & Glade

Mycelium can work standalone. It can also serve as the relational layer beneath the other Good Ship products.

### Drift → Mycelium

When someone fills in a Drift form, that interaction can become a moment in Mycelium. The form response feeds the relationship story.

- Drift form submission triggers a webhook to Mycelium
- Mycelium creates or updates a connection based on the respondent
- The form response becomes a moment with source: 'drift_form'
- Qualities may be inferred from form content

**Example:** A volunteer sign-up form in Drift automatically creates a connection in Mycelium with the quality "emerging" and a moment capturing their interests and availability.

### Undercurrent → Mycelium

Some organisational patterns surfaced in Undercurrent are relational. When Undercurrent detects a signal that involves people or communities, it can surface in Mycelium as a network observation.

- Undercurrent observations tagged with people or communities push to Mycelium
- Mycelium correlates with existing connections
- Cross-product pattern recognition: "This Undercurrent signal about transport barriers matches what three connections in Mycelium have mentioned"

### Glade → Mycelium

Governance decisions have relational consequences. When a decision in Glade affects a relationship (ending a partnership, approving a new collaboration), it can be recorded as a moment in the relevant connection.

- Glade decision records can be linked to Mycelium connections
- Decision outcomes create moments: "Board approved the partnership with [org]"
- Relationship qualities update in response to governance actions

### Mycelium → All

Mycelium's network intelligence can inform the other products:

- **Drift**: suggest who to send a form to based on network position
- **Undercurrent**: contextualise organisational observations with relational data
- **Glade**: surface relational implications of proposed decisions

### Integration Architecture

- Shared authentication (same NextAuth instance, SSO across products)
- Event-driven integration via webhooks (not direct database access)
- Each product owns its own data; integration is via moments and observations
- Integration is optional and configurable per organisation

---

## 15. Build Phases

### Phase 1: Foundation (Weeks 1-6)

- Next.js project setup, Neon database, Drizzle schema
- NextAuth with Google + email providers
- Organisation and user management
- Stripe integration (plans, trial, webhooks)
- Basic API routes for connections and moments
- Natural language moment input (Layer 1)
- Simple connection list view
- Mobile-responsive layout
- CI/CD pipeline with GitHub Actions

**Deliverable:** Users can sign up, create an organisation, add connections via natural language, and view them in a list. Payment works.

### Phase 2: Network (Weeks 7-12)

- Network graph engine (D3.js + WebGL)
- Network link inference from moments
- Cluster detection algorithm
- Network view (primary interface)
- Connection story view with thread display
- Quality spectrum UI
- AI moment understanding pipeline
- Search (full-text + semantic with pgvector)

**Deliverable:** The network view works as the primary interface. Connections have stories and visible qualities. The map reveals structure.

### Phase 3: Intelligence (Weeks 13-18)

- AI thread synthesis (narrative generation)
- Pattern recognition engine
- Observation generation and delivery
- Quality inference from moments
- Dashboard view
- River view (moment stream)
- Constellation view (alternative network viz)
- Organisation roles and permissions matrix
- Space management

**Deliverable:** Mycelium actively observes and offers insights. Multiple views available. Full permission model.

### Phase 4: Migration & Mutual (Weeks 19-24)

- AI-assisted migration conversation engine
- CSV/Excel/Salesforce import parsers
- Migration conversation UI
- Mutual profile system (Layer 4)
- Mutual invitation flow
- Mutual self-service interface
- Privacy controls and consent management
- Safeguarding module

**Deliverable:** Organisations can migrate existing data through conversation. People can hold their own end of the thread.

### Phase 5: Integration & Hardening (Weeks 25-30)

- Drift, Undercurrent, Glade webhook integrations
- Super admin dashboard
- Security hardening and penetration testing
- Performance optimisation (large network rendering)
- Accessibility audit (WCAG 2.1 AA)
- Mobile experience polish
- Documentation and onboarding guides
- Beta programme with selected organisations

**Deliverable:** Production-ready platform with integrations, security audit complete, accessibility certified, beta feedback incorporated.

### Phase 6: Launch (Weeks 31-34)

- Landing page with interactive demos
- Public documentation
- Onboarding flow refinement based on beta feedback
- Performance benchmarking
- Public launch

---

## 16. Open Questions

1. **Naming:** Is "Mycelium" the right name? It's descriptive and beautiful but possibly too long for everyday use. Alternatives to consider: "Mycelia" (shorter), "Spore" (growth-focused), "Root" (foundation), "Hyphae" (the individual threads of mycelium). Or something entirely different.

2. **Network rendering at scale:** For organisations with >1,000 connections, the force-directed network view may become unwieldy. Do we need a fundamentally different visualisation for large networks, or is the Constellation view sufficient?

3. **Voice moment quality:** Voice-to-text for moments relies on transcription accuracy. Is the current state of speech-to-text good enough for natural conversation capture, or do we need a review/edit step?

4. **Mutual layer adoption:** Layer 4 is the most distinctive feature but also the hardest to get adoption on. What's the minimum value proposition for the person on the other end?

5. **Offline support:** Should moment capture work offline (PWA) with sync on reconnect? Critical for fieldwork but adds complexity.

6. **Import from other CRMs:** Beyond Salesforce, which CRM exports should be supported? HubSpot? Airtable? Action Network? CiviCRM?

7. **Reporting:** Some funders will want traditional reports (contact counts, engagement metrics). How much do we accommodate this without reinforcing the extraction model?

8. **API priority:** Should the API be available from launch for integration builders, or gated to Large plan only?

9. **Self-hosted option:** Is there demand for on-premises deployment from larger organisations with strict data policies?

10. **Accessibility of network view:** The network graph is visually rich but potentially challenging for screen reader users. What's the accessible equivalent of seeing your relational ecosystem?

---

*Mycelium — What do your relationships need from you?*

The Good Ship | Version 1.0 | February 2026
