// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_GRAPH_SPLIT,
  readGraphSplit,
  readGraphViewPreference,
  writeGraphSplit,
  writeGraphViewPreference,
} from "./memory-view-preferences";

describe("memory view preferences", () => {
  beforeEach(() => window.localStorage.clear());

  it("defaults to the tree view and a 50/50 split", () => {
    expect(readGraphViewPreference()).toBe(false);
    expect(readGraphSplit()).toEqual(DEFAULT_GRAPH_SPLIT);
  });

  it("round-trips the graph toggle and the split", () => {
    writeGraphViewPreference(true);
    writeGraphSplit({ graph: 62.5, document: 37.5 });
    expect(readGraphViewPreference()).toBe(true);
    expect(readGraphSplit()).toEqual({ graph: 62.5, document: 37.5 });
  });

  it("ignores corrupt or partial stored splits", () => {
    window.localStorage.setItem("paperclip.memory.graphLayout", "{not json");
    expect(readGraphSplit()).toEqual(DEFAULT_GRAPH_SPLIT);
    window.localStorage.setItem("paperclip.memory.graphLayout", JSON.stringify({ graph: 90, document: 90 }));
    expect(readGraphSplit()).toEqual(DEFAULT_GRAPH_SPLIT);
    writeGraphSplit({ graph: 40 });
    expect(readGraphSplit()).toEqual(DEFAULT_GRAPH_SPLIT);
  });
});
