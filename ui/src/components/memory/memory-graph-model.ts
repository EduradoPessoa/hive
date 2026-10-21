import type { MemoryDocumentGraphLink, MemoryDocumentGraphNode } from "@paperclipai/shared";

/**
 * A node as the graph library holds it. The library adds `x`/`y`/`vx`/`vy`
 * (and `fx`/`fy` while dragging) to these objects, so they are the page's own
 * copies, never the objects cached by React Query.
 */
export type GraphNode = {
  id: string;
  title: string;
  folderId: string | null;
  x?: number;
  y?: number;
};

/**
 * Reconciles fresh server nodes with the objects the library already laid out.
 *
 * A document that was on screen keeps its object — and with it its position —
 * so a refetch after an edit does not scatter the graph; only its label data is
 * refreshed. New documents get new objects; removed ones leave the cache.
 */
export function syncGraphNodes(
  cache: Map<string, GraphNode>,
  nodes: readonly MemoryDocumentGraphNode[],
): GraphNode[] {
  const present = new Set<string>();
  const synced = nodes.map((node) => {
    present.add(node.id);
    const existing = cache.get(node.id);
    if (existing) {
      existing.title = node.title;
      existing.folderId = node.folderId;
      return existing;
    }
    const created: GraphNode = { id: node.id, title: node.title, folderId: node.folderId };
    cache.set(node.id, created);
    return created;
  });
  for (const id of [...cache.keys()]) {
    if (!present.has(id)) cache.delete(id);
  }
  return synced;
}

/** Undirected neighbours and degree per document id, from the server's id pairs. */
export function buildNeighborSets(links: readonly MemoryDocumentGraphLink[]) {
  const neighbors = new Map<string, Set<string>>();
  const add = (from: string, to: string) => {
    const set = neighbors.get(from) ?? new Set<string>();
    set.add(to);
    neighbors.set(from, set);
  };
  for (const link of links) {
    add(link.source, link.target);
    add(link.target, link.source);
  }
  const degree = new Map<string, number>();
  for (const [id, set] of neighbors) degree.set(id, set.size);
  return { neighbors, degree };
}
