import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ForceGraphMethods, LinkObject, NodeObject } from "react-force-graph-2d";
import { Loader2, Maximize } from "lucide-react";
import type { MemoryDocumentGraph } from "@paperclipai/shared";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "../../context/ThemeContext";
import { buildNeighborSets, syncGraphNodes, type GraphNode } from "./memory-graph-model";

// The canvas library is large and only this view needs it, so it ships in its
// own chunk and loads the first time the graph is opened.
const ForceGraph2D = lazy(() => import("react-force-graph-2d"));

// The lazily loaded component erases the library's generics, so callbacks see
// its plain node/link shapes; `GraphNode` fields are read off them by name.
type GraphLink = LinkObject;
type GraphMethods = ForceGraphMethods;

type GraphPalette = {
  node: string;
  selected: string;
  neighbor: string;
  link: string;
  label: string;
  font: string;
};

/**
 * Canvas cannot read CSS classes, so the graph takes its colours from the same
 * design tokens the rest of the page uses and re-reads them when the theme
 * flips. Values are passed straight to the canvas, which accepts the
 * `oklch()`/hex forms the tokens are written in.
 */
function readPalette(): GraphPalette {
  const styles = getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;
  return {
    node: token("--muted-foreground", "gray"),
    selected: token("--primary", "orange"),
    neighbor: token("--foreground", "black"),
    link: token("--border", "lightgray"),
    label: token("--foreground", "black"),
    font: getComputedStyle(document.body).fontFamily || "sans-serif",
  };
}

// Canvas units, scaled by the current zoom rather than by CSS.
const NODE_RADIUS = 4;
const SELECTED_NODE_RADIUS = 6;
const LABEL_SIZE = 12;
const LABELS_FOR_ALL_FROM_ZOOM = 1.6;
const DIMMED_ALPHA = 0.3;
const FIT_DURATION_MS = 400;
const FIT_PADDING = 40;

export interface MemoryGraphProps {
  graph: MemoryDocumentGraph;
  selectedDocumentId: string | null;
  onSelectDocument: (documentId: string) => void;
}

/**
 * Force-directed map of Memory documents, linked by their `[[wikilinks]]`.
 *
 * The component stays mounted while documents change beside it, and it keeps
 * one node object per document id across data refreshes, so the layout, zoom
 * and pan a reader has settled on survive both opening another document and a
 * refetch after an edit.
 */
export function MemoryGraph({ graph, selectedDocumentId, onSelectDocument }: MemoryGraphProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<GraphMethods | undefined>(undefined);
  const nodeCache = useRef(new Map<string, GraphNode>());
  const fittedOnce = useRef(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [palette, setPalette] = useState(readPalette);

  useEffect(() => {
    setPalette(readPalette());
  }, [theme]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ width: Math.floor(width), height: Math.floor(height) });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // The library writes positions and velocities onto node objects and swaps
  // link endpoints for node references. It only ever sees these copies — never
  // the objects React Query holds for the page.
  const graphData = useMemo(() => {
    const nodes = syncGraphNodes(nodeCache.current, graph.nodes);
    const links: GraphLink[] = graph.links.map((link) => ({ source: link.source, target: link.target }));
    return { nodes, links };
  }, [graph]);

  const { neighbors, degree } = useMemo(() => buildNeighborSets(graph.links), [graph.links]);
  const highlighted = useMemo(() => {
    if (!selectedDocumentId) return null;
    const set = new Set(neighbors.get(selectedDocumentId) ?? []);
    set.add(selectedDocumentId);
    return set;
  }, [neighbors, selectedDocumentId]);

  const endpointId = (end: GraphLink["source"]) =>
    typeof end === "object" && end !== null ? String((end as NodeObject).id) : String(end);

  const drawNode = useCallback(
    (node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const id = String(node.id);
      const isSelected = id === selectedDocumentId;
      const isNeighbor = !isSelected && (highlighted?.has(id) ?? false);
      const dimmed = highlighted !== null && !highlighted.has(id);
      const radius = isSelected
        ? SELECTED_NODE_RADIUS
        : NODE_RADIUS + Math.min(degree.get(id) ?? 0, 6) * 0.4;
      const x = node.x ?? 0;
      const y = node.y ?? 0;

      ctx.globalAlpha = dimmed ? DIMMED_ALPHA : 1;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = isSelected ? palette.selected : isNeighbor ? palette.neighbor : palette.node;
      ctx.fill();

      const showLabel =
        isSelected || isNeighbor || id === hoveredId || globalScale >= LABELS_FOR_ALL_FROM_ZOOM;
      if (showLabel) {
        const fontSize = LABEL_SIZE / globalScale;
        ctx.font = `${isSelected ? "600 " : ""}${fontSize}px ${palette.font}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = palette.label;
        ctx.fillText(String((node as GraphNode).title ?? ""), x, y + radius + 2 / globalScale);
      }
      ctx.globalAlpha = 1;
    },
    [degree, highlighted, hoveredId, palette, selectedDocumentId],
  );

  const paintPointerArea = useCallback(
    (node: NodeObject, color: string, ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(node.x ?? 0, node.y ?? 0, SELECTED_NODE_RADIUS + 2, 0, 2 * Math.PI);
      ctx.fill();
    },
    [],
  );

  const linkTouchesSelection = useCallback(
    (link: GraphLink) =>
      selectedDocumentId !== null &&
      (endpointId(link.source) === selectedDocumentId || endpointId(link.target) === selectedDocumentId),
    [selectedDocumentId],
  );

  const fitGraph = useCallback(() => {
    graphRef.current?.zoomToFit(FIT_DURATION_MS, FIT_PADDING);
  }, []);

  return (
    <div className="relative h-full w-full min-h-0 bg-background" data-testid="memory-graph">
      <div
        ref={containerRef}
        className="absolute inset-0"
        role="img"
        aria-label={`Graph of ${graph.nodes.length} Memory documents and ${graph.links.length} links`}
      >
        {size.width > 0 && size.height > 0 ? (
          <Suspense
            fallback={
              <p className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Loading graph…
              </p>
            }
          >
            <ForceGraph2D
              ref={graphRef}
              width={size.width}
              height={size.height}
              graphData={graphData}
              nodeId="id"
              // Titles are drawn on the canvas; the library's tooltip renders
              // its label as HTML, which document titles must never become.
              nodeLabel={() => ""}
              nodeCanvasObject={drawNode}
              nodePointerAreaPaint={paintPointerArea}
              linkColor={(link) => (linkTouchesSelection(link) ? palette.selected : palette.link)}
              linkWidth={(link) => (linkTouchesSelection(link) ? 1.5 : 0.75)}
              linkDirectionalArrowLength={3}
              linkDirectionalArrowRelPos={1}
              cooldownTicks={120}
              onEngineStop={() => {
                if (fittedOnce.current) return;
                fittedOnce.current = true;
                fitGraph();
              }}
              onNodeHover={(node) => setHoveredId(node ? String(node.id) : null)}
              onNodeClick={(node) => onSelectDocument(String(node.id))}
            />
          </Suspense>
        ) : null}
      </div>
      <div className="absolute right-2 top-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" variant="outline" onClick={fitGraph} aria-label="Fit graph">
              <Maximize /> Fit graph
            </Button>
          </TooltipTrigger>
          <TooltipContent>Fit every document in view</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

export default MemoryGraph;
