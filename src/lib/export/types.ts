import type { InferSelectModel, Table } from "drizzle-orm";
import type {
  organisations,
  connections,
  moments,
  momentConnections,
  spaces,
  connectionSpaces,
  qualities,
  observations,
  networkLinks,
  organisationMemberships,
} from "@/lib/db/schema";

type Row<T extends Table> = InferSelectModel<T>;

export interface ExportMember {
  role: Row<typeof organisationMemberships>["role"];
  name: string | null;
  email: string;
}

export interface OrgExport {
  exportedAt: string; // ISO
  organisation: Pick<
    Row<typeof organisations>,
    "id" | "name" | "slug" | "plan" | "createdAt"
  >;
  connections: Row<typeof connections>[];
  moments: Row<typeof moments>[];
  momentConnections: Row<typeof momentConnections>[];
  spaces: Row<typeof spaces>[];
  connectionSpaces: Row<typeof connectionSpaces>[];
  qualities: Row<typeof qualities>[];
  observations: Row<typeof observations>[];
  networkLinks: Row<typeof networkLinks>[];
  members: ExportMember[];
}

export type FileTree = Record<string, string>;
