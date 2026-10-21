import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockMemoryDocumentService = vi.hoisted(() => ({
  list: vi.fn(),
  get: vi.fn(),
  resolveByTitle: vi.fn(),
  graph: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  move: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("../services/index.js", () => ({
  memoryDocumentService: () => mockMemoryDocumentService,
  logActivity: vi.fn(),
}));

async function createApp() {
  vi.resetModules();
  const [{ errorHandler }, { memoryDocumentRoutes }] = await Promise.all([
    import("../middleware/index.js") as Promise<typeof import("../middleware/index.js")>,
    import("../routes/memory-documents.js") as Promise<typeof import("../routes/memory-documents.js")>,
  ]);
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).actor = {
      type: "board",
      userId: "user-1",
      companyIds: ["company-1"],
      source: "session",
      isInstanceAdmin: false,
    };
    next();
  });
  app.use("/api", memoryDocumentRoutes({} as any));
  app.use(errorHandler);
  return app;
}

describe("memory document routes", () => {
  beforeEach(() => {
    for (const mock of Object.values(mockMemoryDocumentService)) mock.mockReset();
  });

  it("serves the graph before the document-id route", async () => {
    const graph = { nodes: [{ id: "d1", title: "Doc", folderId: null }], links: [] };
    mockMemoryDocumentService.graph.mockResolvedValue(graph);

    const res = await request(await createApp()).get("/api/companies/company-1/memory-documents/graph");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(graph);
    expect(mockMemoryDocumentService.graph).toHaveBeenCalledWith("company-1");
    expect(mockMemoryDocumentService.get).not.toHaveBeenCalled();
  });

  it("refuses another company's graph", async () => {
    const res = await request(await createApp()).get("/api/companies/company-2/memory-documents/graph");

    expect(res.status).toBe(403);
    expect(mockMemoryDocumentService.graph).not.toHaveBeenCalled();
  });
});
