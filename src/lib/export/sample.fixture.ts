import type { OrgExport } from "./types";

/**
 * A small, deterministic export graph for unit tests. All ids and dates are
 * fixed (no Date.now()/new Date() without args) so renderers produce stable,
 * comparable output across runs.
 */

// Fixed identifiers so cross-links between rows are readable and stable.
const ORG_ID = "00000000-0000-0000-0000-0000000000a0";
const CONNECTION_1_ID = "00000000-0000-0000-0000-0000000000c1";
const CONNECTION_2_ID = "00000000-0000-0000-0000-0000000000c2";
const MOMENT_SHARED_ID = "00000000-0000-0000-0000-0000000000d1";
const MOMENT_SOLO_ID = "00000000-0000-0000-0000-0000000000d2";
const SPACE_ID = "00000000-0000-0000-0000-0000000000e1";
const QUALITY_ID = "00000000-0000-0000-0000-0000000000f1";
const OBSERVATION_ID = "00000000-0000-0000-0000-0000000000a1";
const NETWORK_LINK_ID = "00000000-0000-0000-0000-0000000000b1";

const CREATED_AT = new Date("2026-01-01T00:00:00.000Z");
const EVENT_DATE = new Date("2026-01-02T09:30:00.000Z");
const THREAD_UPDATED_AT = new Date("2026-01-03T12:00:00.000Z");

export function sampleExport(): OrgExport {
  return {
    exportedAt: "2026-01-04T00:00:00.000Z",
    organisation: {
      id: ORG_ID,
      name: "Acme Collective",
      slug: "acme",
      plan: "organisation",
      createdAt: CREATED_AT,
    },
    connections: [
      {
        id: CONNECTION_1_ID,
        organisationId: ORG_ID,
        name: "Ada Lovelace",
        type: "person",
        threadSummary: "A warm, steady thread built over several conversations.",
        threadUpdatedAt: THREAD_UPDATED_AT,
        contactDetails: { email: "ada@example.com", location: "London" },
        metadata: {},
        createdAt: CREATED_AT,
        updatedAt: CREATED_AT,
      },
      {
        id: CONNECTION_2_ID,
        organisationId: ORG_ID,
        name: "Bramble Trust",
        type: "organisation",
        threadSummary: null,
        threadUpdatedAt: null,
        contactDetails: {},
        metadata: {},
        createdAt: CREATED_AT,
        updatedAt: CREATED_AT,
      },
    ],
    moments: [
      {
        id: MOMENT_SHARED_ID,
        organisationId: ORG_ID,
        authorId: null,
        content: "Both connections attended the community planting day.",
        source: "manual",
        eventDate: EVENT_DATE,
        attachments: [],
        aiExtraction: {},
        spaceId: SPACE_ID,
        createdAt: CREATED_AT,
      },
      {
        id: MOMENT_SOLO_ID,
        organisationId: ORG_ID,
        authorId: null,
        content: "A quiet catch-up with Ada about next steps.",
        source: "voice",
        eventDate: null,
        attachments: [],
        aiExtraction: {},
        spaceId: null,
        createdAt: CREATED_AT,
      },
    ],
    // Both connections link to the SAME shared moment, plus Ada to her solo moment.
    momentConnections: [
      { momentId: MOMENT_SHARED_ID, connectionId: CONNECTION_1_ID },
      { momentId: MOMENT_SHARED_ID, connectionId: CONNECTION_2_ID },
      { momentId: MOMENT_SOLO_ID, connectionId: CONNECTION_1_ID },
    ],
    spaces: [
      {
        id: SPACE_ID,
        organisationId: ORG_ID,
        name: "Community Garden",
        description: "A shared space for local growing projects.",
        settings: {},
        createdAt: CREATED_AT,
      },
    ],
    connectionSpaces: [
      { connectionId: CONNECTION_1_ID, spaceId: SPACE_ID },
    ],
    qualities: [
      {
        id: QUALITY_ID,
        connectionId: CONNECTION_1_ID,
        spectrum: "trust",
        position: 0.7,
        confidence: 0.6,
        source: "inferred",
        momentId: MOMENT_SHARED_ID,
        createdAt: CREATED_AT,
      },
    ],
    observations: [
      {
        id: OBSERVATION_ID,
        organisationId: ORG_ID,
        type: "theme",
        content: "Community events keep bringing these two together.",
        connections: [CONNECTION_1_ID, CONNECTION_2_ID],
        severity: "gentle",
        status: "new",
        userResponse: null,
        dueAt: null,
        sourceMomentId: null,
        createdAt: CREATED_AT,
      },
    ],
    networkLinks: [
      {
        id: NETWORK_LINK_ID,
        organisationId: ORG_ID,
        sourceConnectionId: CONNECTION_1_ID,
        targetConnectionId: CONNECTION_2_ID,
        strength: 0.5,
        source: "inferred",
        createdAt: CREATED_AT,
      },
    ],
    members: [
      {
        role: "owner",
        name: "Grace Hopper",
        email: "grace@example.com",
      },
    ],
  };
}
