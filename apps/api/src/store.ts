import crypto from "crypto";

export interface SandboxTestCase {
  id: string;
  projectId: string;
  title: string;
  description: string;
  instructions: string;
  platform: string;
  tags: string[];
  parameters: Record<string, any>;
  metadata: Record<string, any>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryTestCase extends SandboxTestCase {
  state: "LIBRARY";
  version: number;
  promotedFrom: string;
  promotionNotes: string;
}

const sandboxMap = new Map<string, SandboxTestCase>();
const libraryMap = new Map<string, LibraryTestCase>();

function createId(prefix: string) {
  return `${prefix}-${crypto.randomBytes(6).toString("hex")}`;
}

export function createSandboxCase(data: Omit<SandboxTestCase, "id" | "createdAt" | "updatedAt">) {
  const id = createId("sb");
  const now = new Date().toISOString();
  const testCase: SandboxTestCase = {
    id,
    createdAt: now,
    updatedAt: now,
    ...data,
  };
  sandboxMap.set(id, testCase);
  return testCase;
}

export function getSandboxCase(id: string) {
  return sandboxMap.get(id) ?? null;
}

export function createLibraryCase(sandbox: SandboxTestCase, metadata: { promotedFrom: string; promotionNotes: string }) {
  const id = createId("lib");
  const now = new Date().toISOString();
  const libraryCase: LibraryTestCase = {
    ...sandbox,
    id,
    state: "LIBRARY",
    version: 1,
    promotedFrom: metadata.promotedFrom,
    promotionNotes: metadata.promotionNotes,
    createdAt: now,
    updatedAt: now,
  };
  libraryMap.set(id, libraryCase);
  return libraryCase;
}
