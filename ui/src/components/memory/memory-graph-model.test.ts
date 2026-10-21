import { describe, expect, it } from "vitest";
import { buildNeighborSets, syncGraphNodes, type GraphNode } from "./memory-graph-model";

describe("syncGraphNodes", () => {
  it("keeps laid-out node objects across refreshes and never reuses server objects", () => {
    const cache = new Map<string, GraphNode>();
    const serverNodes = [
      { id: "a", title: "A", folderId: null },
      { id: "b", title: "B", folderId: null },
    ];
    const first = syncGraphNodes(cache, serverNodes);
    expect(first[0]).not.toBe(serverNodes[0]);
    first[0]!.x = 10;
    first[0]!.y = 20;

    const second = syncGraphNodes(cache, [
      { id: "a", title: "A renamed", folderId: "f1" },
      { id: "c", title: "C", folderId: null },
    ]);
    expect(second[0]).toBe(first[0]);
    expect(second[0]).toMatchObject({ title: "A renamed", folderId: "f1", x: 10, y: 20 });
    expect(second.map((node) => node.id)).toEqual(["a", "c"]);
    expect([...cache.keys()].sort()).toEqual(["a", "c"]);
    // The server objects were not touched.
    expect(serverNodes[0]).toEqual({ id: "a", title: "A", folderId: null });
  });
});

describe("buildNeighborSets", () => {
  it("treats links as undirected and counts distinct neighbours", () => {
    const { neighbors, degree } = buildNeighborSets([
      { source: "a", target: "b" },
      { source: "b", target: "a" },
      { source: "a", target: "c" },
    ]);
    expect([...(neighbors.get("a") ?? [])].sort()).toEqual(["b", "c"]);
    expect(degree.get("a")).toBe(2);
    expect(degree.get("b")).toBe(1);
    expect(neighbors.has("d")).toBe(false);
  });
});
