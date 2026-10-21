import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { companies, createDb, folders, memoryDocuments } from "@paperclipai/db";
import {
  getEmbeddedPostgresTestSupport,
  startEmbeddedPostgresTestDatabase,
} from "./helpers/embedded-postgres.js";
import { memoryDocumentService } from "../services/memory-documents.js";

const embeddedPostgresSupport = await getEmbeddedPostgresTestSupport();
const describeEmbeddedPostgres = embeddedPostgresSupport.supported ? describe : describe.skip;

describeEmbeddedPostgres("memory document graph", () => {
  let db!: ReturnType<typeof createDb>;
  let tempDb: Awaited<ReturnType<typeof startEmbeddedPostgresTestDatabase>> | null = null;

  beforeAll(async () => {
    tempDb = await startEmbeddedPostgresTestDatabase("paperclip-memory-graph-");
    db = createDb(tempDb.connectionString);
  }, 20_000);

  afterEach(async () => {
    await db.delete(memoryDocuments);
    await db.delete(folders);
    await db.delete(companies);
  });

  afterAll(async () => {
    await tempDb?.cleanup();
  });

  async function seedCompany() {
    const companyId = randomUUID();
    await db.insert(companies).values({
      id: companyId,
      name: "Paperclip",
      issuePrefix: `T${companyId.replace(/-/g, "").slice(0, 6).toUpperCase()}`,
      requireBoardApprovalForNewAgents: false,
      defaultResponsibleUserId: "responsible-user",
    });
    return companyId;
  }

  const titleOf = (graph: { nodes: Array<{ id: string; title: string }> }, id: string) =>
    graph.nodes.find((node) => node.id === id)?.title;

  it("derives deduplicated links, drops unresolved/self/code targets and keeps isolated nodes", async () => {
    const companyId = await seedCompany();
    const svc = memoryDocumentService(db);
    const alpha = await svc.create(companyId, {
      title: "Alpha",
      markdown: "[[Beta]] [[beta]] [[Beta|again]] [[Alpha]] [[Missing]] `[[Gamma]]`",
    });
    const beta = await svc.create(companyId, { title: "Beta", markdown: "Back to [[alpha]]." });
    const gamma = await svc.create(companyId, { title: "Gamma" });

    const graph = await svc.graph(companyId);
    expect(graph.nodes.map((node) => node.title)).toEqual(["Alpha", "Beta", "Gamma"]);
    expect(graph.nodes.find((node) => node.id === gamma.id)).toEqual({
      id: gamma.id,
      title: "Gamma",
      folderId: null,
    });
    expect(graph.links).toEqual(
      expect.arrayContaining([
        { source: alpha.id, target: beta.id },
        { source: beta.id, target: alpha.id },
      ]),
    );
    expect(graph.links).toHaveLength(2);
    expect(JSON.stringify(graph)).not.toContain("markdown");
  });

  it("handles ~60 documents including isolated ones", async () => {
    const companyId = await seedCompany();
    const svc = memoryDocumentService(db);
    const created = [];
    for (let index = 0; index < 60; index++) {
      // Every third document links to the next one; the rest are isolated.
      const markdown = index % 3 === 0 && index < 59 ? `Next: [[Doc ${index + 1}]]` : "";
      created.push(await svc.create(companyId, { title: `Doc ${index}`, markdown }));
    }
    const graph = await svc.graph(companyId);
    expect(graph.nodes).toHaveLength(60);
    expect(graph.links).toHaveLength(20);
    const linked = new Set(graph.links.flatMap((link) => [link.source, link.target]));
    expect(created.filter((doc) => !linked.has(doc.id)).length).toBe(20);
  });

  it("resolves the reader and the graph the same way, including renames and ambiguous titles", async () => {
    const companyId = await seedCompany();
    const svc = memoryDocumentService(db);
    const renamed = await svc.create(companyId, { title: "Old Name" });
    await svc.update(companyId, renamed.id, { title: "New Name" });
    const dupA = await svc.create(companyId, { title: "Notes" });
    await svc.create(companyId, { title: "notes" });
    const source = await svc.create(companyId, {
      title: "Source",
      markdown: "[[old-name]] [[New Name]] [[Notes]] [[notes-2]]",
    });

    // The slug survives a rename, so both names keep working.
    expect((await svc.get(companyId, renamed.id)).slug).toBe("old-name");
    expect((await svc.resolveByTitle(companyId, "old-name"))?.id).toBe(renamed.id);
    expect((await svc.resolveByTitle(companyId, "new name"))?.id).toBe(renamed.id);
    // An ambiguous title resolves to nothing rather than to an arbitrary row.
    expect(await svc.resolveByTitle(companyId, "Notes")).toBeNull();
    expect((await svc.resolveByTitle(companyId, "notes"))?.id).toBe(dupA.id);

    const graph = await svc.graph(companyId);
    const targets = graph.links
      .filter((link) => link.source === source.id)
      .map((link) => titleOf(graph, link.target));
    expect(targets).toEqual(["New Name", "notes"]);
  });

  it("reflects edits, moves and deletes", async () => {
    const companyId = await seedCompany();
    const svc = memoryDocumentService(db);
    const a = await svc.create(companyId, { title: "A", markdown: "[[B]]" });
    const b = await svc.create(companyId, { title: "B" });
    expect((await svc.graph(companyId)).links).toEqual([{ source: a.id, target: b.id }]);

    await svc.update(companyId, a.id, { markdown: "no links now" });
    expect((await svc.graph(companyId)).links).toEqual([]);

    const [folder] = await db
      .insert(folders)
      .values({ companyId, kind: "memory", name: "Project", slug: "project" })
      .returning();
    await svc.move(companyId, b.id, { folderId: folder!.id });
    expect((await svc.graph(companyId)).nodes.find((node) => node.id === b.id)?.folderId).toBe(folder!.id);

    await svc.update(companyId, a.id, { markdown: "[[B]]" });
    await svc.delete(companyId, b.id);
    const graph = await svc.graph(companyId);
    expect(graph.nodes.map((node) => node.id)).toEqual([a.id]);
    expect(graph.links).toEqual([]);
  });

  it("never mixes companies", async () => {
    const companyA = await seedCompany();
    const companyB = await seedCompany();
    const svc = memoryDocumentService(db);
    await svc.create(companyA, { title: "Shared Name", markdown: "[[Other]]" });
    await svc.create(companyB, { title: "Other" });

    const graphA = await svc.graph(companyA);
    expect(graphA.nodes.map((node) => node.title)).toEqual(["Shared Name"]);
    expect(graphA.links).toEqual([]);
    expect(await svc.resolveByTitle(companyA, "Other")).toBeNull();
  });
});
