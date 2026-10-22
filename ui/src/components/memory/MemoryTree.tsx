import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  ChevronRight,
  FileText,
  Folder as FolderIcon,
  FilePlus,
  FolderOutput,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import type { FolderListItem, MemoryDocumentListItem } from "@paperclipai/shared";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  MEMORY_ROOT_AREA_DROP_ID,
  MEMORY_ROOT_DROP_ID,
  memoryDragId as dragId,
  isValidMemoryDropTarget,
  memoryDragPreview,
  resolveMemoryDrop,
  type MemoryFolderNode,
  type MemoryTreeModel,
} from "./memory-tree";

export interface MemoryTreeProps {
  model: MemoryTreeModel;
  selectedDocumentId: string | null;
  onSelectDocument: (documentId: string) => void;
  onCreateFolder: (parentId: string | null) => void;
  onCreateDocument: (folderId: string | null) => void;
  onRenameFolder: (folder: FolderListItem) => void;
  onDeleteFolder: (folder: FolderListItem) => void;
  onRenameDocument: (document: MemoryDocumentListItem) => void;
  onDeleteDocument: (document: MemoryDocumentListItem) => void;
  onMoveDocument: (documentId: string, folderId: string | null) => void;
  onMoveFolder: (folderId: string, parentId: string | null) => void;
}

const rowClass =
  "group/row flex h-8 w-full items-center gap-1.5 rounded-md pr-1 text-sm transition-colors";

function RowActions({ children }: { children: React.ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Row actions"
          className="ml-auto opacity-0 transition-opacity group-hover/row:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}

function DocumentRow({
  document,
  depth,
  selected,
  onSelect,
  onRename,
  onDelete,
}: {
  document: MemoryDocumentListItem;
  depth: number;
  selected: boolean;
  onSelect: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dragId.document(document.id),
  });

  return (
    <div
      ref={setNodeRef}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
      className={cn(
        rowClass,
        "cursor-pointer",
        selected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
        isDragging && "opacity-50",
      )}
      data-testid="memory-document-row"
      {...attributes}
      {...listeners}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <FileText className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{document.title}</span>
      <RowActions>
        <DropdownMenuItem onSelect={onRename}>
          <Pencil /> Rename
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2 /> Delete
        </DropdownMenuItem>
      </RowActions>
    </div>
  );
}

function FolderRow({
  node,
  depth,
  expanded,
  onToggle,
  validDropTarget,
  dragging,
  inClosedBranch,
  props,
}: {
  node: MemoryFolderNode;
  depth: number;
  expanded: boolean;
  onToggle: () => void;
  /** Releasing the dragged node here would move it. */
  validDropTarget: boolean;
  /** Something is being dragged, so non-targets should read as inert. */
  dragging: boolean;
  /**
   * Inside a collapsed folder. Those rows stay mounted so the fold can animate,
   * and their boxes keep their full size under the clip — so they must not be
   * offered as drop targets, or the pointer could "hit" a row nobody can see.
   */
  inClosedBranch: boolean;
  props: MemoryTreeProps;
}) {
  const folder = node.folder;
  const draggable = useDraggable({ id: dragId.folder(folder.id) });
  const droppable = useDroppable({ id: dragId.folder(folder.id), disabled: !validDropTarget || inClosedBranch });
  const isOver = droppable.isOver && validDropTarget && !inClosedBranch;

  return (
    <div
      ref={droppable.setNodeRef}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
      className={cn(
        rowClass,
        "cursor-pointer outline outline-2 -outline-offset-2 outline-transparent",
        // While dragging, hover only means something on a folder that can take
        // the node; an invalid folder keeps its resting look.
        !dragging && "hover:bg-accent/50",
        // Yellow outline = "you can drop it here". The outline is always there,
        // transparent, so its colour fades in rather than popping.
        isOver && "bg-accent/40 outline-(--memory-drop-outline)",
        draggable.isDragging && "opacity-50",
      )}
      data-testid="memory-folder-row"
      onClick={onToggle}
    >
      <span ref={draggable.setNodeRef} className="flex min-w-0 items-center gap-1.5" {...draggable.attributes} {...draggable.listeners}>
        <ChevronRight
          className={cn("size-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-90")}
        />
        <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{folder.name}</span>
      </span>
      <RowActions>
        <DropdownMenuItem onSelect={() => props.onCreateDocument(folder.id)}>
          <FilePlus /> New document
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => props.onCreateFolder(folder.id)}>
          <FolderPlus /> New subfolder
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => props.onRenameFolder(folder)}>
          <Pencil /> Rename
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={() => props.onDeleteFolder(folder)}>
          <Trash2 /> Delete
        </DropdownMenuItem>
      </RowActions>
    </div>
  );
}

function FolderBranch({
  node,
  depth,
  expandedIds,
  toggle,
  isValidTarget,
  dragging,
  inClosedBranch = false,
  props,
}: {
  node: MemoryFolderNode;
  depth: number;
  expandedIds: Set<string>;
  toggle: (folderId: string) => void;
  isValidTarget: (folderId: string) => boolean;
  dragging: boolean;
  inClosedBranch?: boolean;
  props: MemoryTreeProps;
}) {
  const expanded = expandedIds.has(node.folder.id);
  return (
    <>
      <FolderRow
        node={node}
        depth={depth}
        expanded={expanded}
        onToggle={() => toggle(node.folder.id)}
        validDropTarget={isValidTarget(node.folder.id)}
        dragging={dragging}
        inClosedBranch={inClosedBranch}
        props={props}
      />
      {/* Always mounted so opening and closing can animate; `inert` keeps the
          hidden rows out of tab order and the accessibility tree. */}
      <div className="memory-folder-fold" data-open={expanded ? "true" : "false"} inert={!expanded}>
        <div>
          {node.folders.map((child) => (
            <FolderBranch
              key={child.folder.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              toggle={toggle}
              isValidTarget={isValidTarget}
              dragging={dragging}
              inClosedBranch={inClosedBranch || !expanded}
              props={props}
            />
          ))}
          {node.documents.map((document) => (
            <DocumentRow
              key={document.id}
              document={document}
              depth={depth + 1}
              selected={props.selectedDocumentId === document.id}
              onSelect={() => props.onSelectDocument(document.id)}
              onRename={() => props.onRenameDocument(document)}
              onDelete={() => props.onDeleteDocument(document)}
            />
          ))}
          {node.folders.length === 0 && node.documents.length === 0 ? (
            <p
              style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
              className="py-1 text-xs text-muted-foreground"
            >
              Empty
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}

/**
 * Appears only mid-drag, and only when the dragged node actually sits inside a
 * folder. Floats over the bottom of the rail rather than taking part in the
 * layout: inserting a row at drag start would shove the tree down by its own
 * height, moving the folder the user was aiming at.
 */
/**
 * What follows the cursor while a node is dragged: the node's icon and name in
 * a compact card, so it is clear what is being moved even after the pointer
 * leaves the row it came from. Purely visual — the real row stays in place,
 * dimmed, and the pointer never lands on this card.
 */
function DragPreview({ kind, label }: { kind: "document" | "folder"; label: string }) {
  const Icon = kind === "document" ? FileText : FolderIcon;
  return (
    <div
      data-testid="memory-drag-preview"
      className="pointer-events-none flex h-8 max-w-64 cursor-grabbing items-center gap-1.5 rounded-md border border-border bg-popover px-2 text-sm text-popover-foreground shadow-md"
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{label}</span>
    </div>
  );
}

function RootDropZone() {
  const { setNodeRef, isOver } = useDroppable({ id: MEMORY_ROOT_DROP_ID });
  return (
    <div
      ref={setNodeRef}
      data-testid="memory-root-drop-zone"
      className={cn(
        "absolute inset-x-2 bottom-2 z-10 flex h-9 items-center justify-center rounded-md border border-dashed text-xs shadow-sm backdrop-blur-sm transition-colors",
        isOver
          ? "border-transparent bg-accent/40 text-accent-foreground outline outline-2 -outline-offset-2 outline-(--memory-drop-outline)"
          : "border-border bg-background/90 text-muted-foreground outline outline-2 -outline-offset-2 outline-transparent",
      )}
    >
      <FolderOutput className="mr-1.5 size-3.5" />
      Move out of folder
    </div>
  );
}

export function MemoryTree(props: MemoryTreeProps) {
  const { model } = props;
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [activeDrag, setActiveDrag] = useState<{ kind: string; id: string } | null>(null);
  const sensors = useSensors(
    // Desktop-only drag, matching the projects rail: touch stays tap/scroll.
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
  );
  const activeRawId = activeDrag ? `${activeDrag.kind}:${activeDrag.id}` : null;

  // The root is a destination only when the node is nested to begin with — the
  // same rule the drop uses, so the strip and the rail's empty space light up
  // exactly when releasing there would unfile the node.
  const rootIsValidTarget = isValidMemoryDropTarget(model, activeRawId, MEMORY_ROOT_DROP_ID);
  const draggedIsNested = rootIsValidTarget;
  const rootAreaDroppable = useDroppable({ id: MEMORY_ROOT_AREA_DROP_ID, disabled: !rootIsValidTarget });
  const preview = memoryDragPreview(model, activeRawId);
  const isValidTarget = (folderId: string) =>
    isValidMemoryDropTarget(model, activeRawId, dragId.folder(folderId));

  function toggle(folderId: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDrag(null);
    const { active, over } = event;
    const drop = resolveMemoryDrop(model, String(active.id), over ? String(over.id) : null);
    if (!drop) return;
    if (drop.kind === "document") props.onMoveDocument(drop.id, drop.targetFolderId);
    else props.onMoveFolder(drop.id, drop.targetFolderId);
  }

  const empty = model.folders.length === 0 && model.documents.length === 0;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={(event) => setActiveDrag(dragId.parse(String(event.active.id)))}
      onDragCancel={() => setActiveDrag(null)}
      onDragEnd={handleDragEnd}
    >
      <div className="flex items-center gap-1 px-2 pb-2">
        <Button
          variant="outline"
          size="xs"
          className="flex-1"
          onClick={() => props.onCreateDocument(null)}
        >
          <FilePlus /> Document
        </Button>
        <Button
          variant="outline"
          size="xs"
          aria-label="New folder"
          onClick={() => props.onCreateFolder(null)}
        >
          <FolderPlus />
        </Button>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
      {draggedIsNested ? <RootDropZone /> : null}

      <div
        ref={rootAreaDroppable.setNodeRef}
        data-testid="memory-tree"
        className={cn(
          "min-h-0 flex-1 overflow-y-auto pb-2 scrollbar-auto-hide",
          rootAreaDroppable.isOver && rootIsValidTarget && "bg-accent/30 outline outline-2 -outline-offset-2 outline-(--memory-drop-outline)",
          // Keep the last row reachable above the floating strip.
          draggedIsNested && "pb-14",
        )}
      >
        {empty ? (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            No documents yet. Create one to start your knowledge base.
          </p>
        ) : null}
        {model.folders.map((node) => (
          <FolderBranch
            key={node.folder.id}
            node={node}
            depth={0}
            expandedIds={expandedIds}
            toggle={toggle}
            isValidTarget={isValidTarget}
            dragging={activeDrag !== null}
            props={props}
          />
        ))}
        {model.documents.map((document) => (
          <DocumentRow
            key={document.id}
            document={document}
            depth={0}
            selected={props.selectedDocumentId === document.id}
            onSelect={() => props.onSelectDocument(document.id)}
            onRename={() => props.onRenameDocument(document)}
            onDelete={() => props.onDeleteDocument(document)}
          />
        ))}
      </div>
      </div>

      {/* Portalled by dnd-kit, so the card is never clipped by the rail's
          scroll area and always tracks the pointer. */}
      <DragOverlay dropAnimation={null}>
        {preview ? <DragPreview kind={preview.kind} label={preview.label} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
