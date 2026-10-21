/**
 * Per-browser Memory layout preferences: whether the graph view is on and how
 * the graph/document split is sized. Both are conveniences, so every read
 * falls back to the default and every write is best-effort.
 */
const GRAPH_VIEW_KEY = "paperclip.memory.graphView";
const GRAPH_LAYOUT_KEY = "paperclip.memory.graphLayout";

export const GRAPH_PANEL_ID = "graph";
export const DOCUMENT_PANEL_ID = "document";

export type GraphSplitLayout = Record<typeof GRAPH_PANEL_ID | typeof DOCUMENT_PANEL_ID, number>;

export const DEFAULT_GRAPH_SPLIT: GraphSplitLayout = { graph: 50, document: 50 };

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readGraphViewPreference(): boolean {
  try {
    return storage()?.getItem(GRAPH_VIEW_KEY) === "true";
  } catch {
    return false;
  }
}

export function writeGraphViewPreference(enabled: boolean) {
  try {
    storage()?.setItem(GRAPH_VIEW_KEY, String(enabled));
  } catch {
    // The toggle still works for this visit.
  }
}

/** A stored split only counts when both sides are sane percentages. */
export function readGraphSplit(): GraphSplitLayout {
  try {
    const raw = storage()?.getItem(GRAPH_LAYOUT_KEY);
    if (!raw) return DEFAULT_GRAPH_SPLIT;
    const parsed = JSON.parse(raw) as Partial<GraphSplitLayout>;
    const graph = Number(parsed.graph);
    const document = Number(parsed.document);
    if (!Number.isFinite(graph) || !Number.isFinite(document)) return DEFAULT_GRAPH_SPLIT;
    if (graph <= 0 || document <= 0 || Math.abs(graph + document - 100) > 1) return DEFAULT_GRAPH_SPLIT;
    return { graph, document };
  } catch {
    return DEFAULT_GRAPH_SPLIT;
  }
}

export function writeGraphSplit(layout: Record<string, number>) {
  const graph = layout[GRAPH_PANEL_ID];
  const document = layout[DOCUMENT_PANEL_ID];
  if (graph === undefined || document === undefined) return;
  try {
    storage()?.setItem(GRAPH_LAYOUT_KEY, JSON.stringify({ graph, document }));
  } catch {
    // Resizing still works when browser storage is unavailable.
  }
}
