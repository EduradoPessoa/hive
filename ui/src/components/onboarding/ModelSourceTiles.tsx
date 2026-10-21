import { useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Ellipsis } from "lucide-react";

import { cn } from "../../lib/utils";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  SOURCE_EXIT_FADE,
  SOURCE_COLLAPSE_MOVE,
  TAG_SWAP_ENTER,
  TAG_SWAP_EXIT,
  TAG_SWAP_TRAVEL,
} from "./onboarding-motion";

/**
 * The connect step's row of model sources, and the tag under each one saying
 * which credential the source would be reached with.
 *
 * Presentational only — the caller owns which source is picked and which
 * credential mode is in force, because both outlive this row: the mode is set
 * by a checkbox that sits below it, and the selection drives the step's CTA.
 */

/** How a source gets authenticated. Every tile is in the same mode at once. */
export type CredentialMode = "subscription" | "api";

export type ModelSource = {
  id: string;
  label: string;
  /** The brand mark, rendered into a 30px square. */
  icon: ReactNode;
};

/** A source offered from the "more" picker, which has room to say what it is. */
export type MoreModelSource = ModelSource & {
  description?: string;
};

/**
 * The sources that do not earn a tile of their own.
 *
 * They sit behind one extra tile so the row stays a two-way question for the
 * customer who already knows the answer, while everyone else can still reach
 * the long tail without leaving the step.
 */
export type MoreModelSources = {
  /** The idle tile's name, e.g. "More tools". */
  label: string;
  sources: MoreModelSource[];
};

const CREDENTIAL_TAG_LABEL: Record<CredentialMode, string> = {
  subscription: "Subscription",
  api: "API",
};

/**
 * The credential tag, swapping in a fixed-height slot.
 *
 * The slot has to hold its height whatever is in it: the tag is the last line
 * of the tile, and a label that measured itself would resize the tile mid-swap
 * and nudge the two beside it. `overflow-hidden` is doing real work too — it is
 * what makes the outgoing label fall out of frame rather than slide past the
 * tile's padding and over the row below.
 */
export function CredentialTag({ mode }: { mode: CredentialMode }) {
  return (
    <span className="relative flex h-4 w-full items-center justify-center overflow-hidden text-(length:--text-micro) text-muted-foreground">
      <AnimatePresence initial={false} mode="sync">
        <motion.span
          key={mode}
          className="absolute inset-0 flex items-center justify-center whitespace-nowrap"
          initial={{ opacity: 0, y: TAG_SWAP_TRAVEL }}
          animate={{ opacity: 1, y: 0, transition: TAG_SWAP_ENTER }}
          exit={{ opacity: 0, y: TAG_SWAP_TRAVEL, transition: TAG_SWAP_EXIT }}
        >
          {CREDENTIAL_TAG_LABEL[mode]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function tileClassName(selected: boolean, settling: boolean): string {
  return cn(
    "flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-1.5 self-stretch rounded-md border p-3",
    "transition-(--tp-border-color-background-color) ease-(--motion-ease-standard)",
    settling ? "duration-(--motion-duration-slow)" : "duration-(--motion-duration-fast)",
    "outline-none focus-visible:ring-ring/50 focus-visible:ring-(length:--rad-3)",
    selected
      ? "border-foreground/40 bg-accent"
      : "border-border bg-card hover:bg-accent/40",
  );
}

function ModelSourceTile({
  source,
  mode,
  selected,
  onSelect,
  buttonRef,
  settling,
}: {
  source: ModelSource;
  mode: CredentialMode;
  selected: boolean;
  onSelect: () => void;
  buttonRef: (node: HTMLButtonElement | null) => void;
  settling: boolean;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={tileClassName(selected, settling)}
    >
      <span className="flex size-(--sz-30px) shrink-0 items-center justify-center">
        {source.icon}
      </span>
      {/*
        One step up the named ladder each — the source name from text-xs (12px)
        to --text-compact (13px), the tag under it from --text-nano (10px) to
        --text-micro (11px), keeping the two a step apart. Both use the
        font-size-only token form, so the line box comes from the tile's own
        rhythm rather than the Tailwind scale's paired line-height.
      */}
      <span className="text-(length:--text-compact) font-medium text-foreground">
        {source.label}
      </span>
      <CredentialTag mode={mode} />
    </button>
  );
}

/**
 * The tile that opens the rest of the sources.
 *
 * Idle, it is a neutral "more" tile. Once one of its sources is picked it
 * becomes that source's tile — same mark, same name, same credential tag as the
 * featured two — with a chevron to say it can still be changed. The list is a
 * searchable popover with its own width, because one tile is too narrow to
 * hold a name and a description side by side.
 */
function MoreSourcesTile({
  more,
  mode,
  selected,
  onSelect,
  settling,
}: {
  more: MoreModelSources;
  mode: CredentialMode;
  selected: MoreModelSource | null;
  onSelect: (id: string) => void;
  settling: boolean;
}) {
  const [open, setOpen] = useState(false);
  const label = selected?.label ?? more.label;
  const trigger = (
    <PopoverTrigger asChild>
      <button
        type="button"
        role="radio"
        aria-checked={selected !== null}
        aria-haspopup="listbox"
        aria-label={selected ? `${label}, change tool` : more.label}
        className={tileClassName(selected !== null, settling)}
      >
        <span className="flex size-(--sz-30px) shrink-0 items-center justify-center">
          {selected ? selected.icon : <Ellipsis className="size-full text-muted-foreground" />}
        </span>
        <span className="flex items-center gap-1 text-(length:--text-compact) font-medium text-foreground">
          {label}
          <ChevronDown className="size-3 text-muted-foreground" aria-hidden />
        </span>
        {selected ? (
          <CredentialTag mode={mode} />
        ) : (
          <span className="flex h-4 w-full items-center justify-center text-(length:--text-micro) text-muted-foreground">
            {more.sources.length} more
          </span>
        )}
      </button>
    </PopoverTrigger>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {trigger}
      <PopoverContent
        align="end"
        className="w-(--sz-source-popover) p-0"
      >
        <Command>
          <CommandInput placeholder="Search tools..." />
          <CommandList>
            <CommandEmpty>No tool found.</CommandEmpty>
            {more.sources.map((source) => (
              <CommandItem
                key={source.id}
                value={`${source.label} ${source.description ?? ""}`}
                onSelect={() => {
                  setOpen(false);
                  onSelect(source.id);
                }}
                className="gap-3 py-2"
              >
                <span className="flex size-5 shrink-0 items-center justify-center">
                  {source.icon}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-(length:--text-compact) font-medium text-foreground">
                    {source.label}
                  </span>
                  {source.description && (
                    <span className="truncate text-(length:--text-micro) text-muted-foreground">
                      {source.description}
                    </span>
                  )}
                </span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function ModelSourceTiles({
  sources,
  mode,
  selectedId,
  onSelect,
  label,
  more,
  collapsed = false,
  settling = false,
}: {
  sources: ModelSource[];
  /** Further sources, offered through one extra tile after the featured ones. */
  more?: MoreModelSources;
  mode: CredentialMode;
  /** `null` before anything has been picked — the step opens this way. */
  selectedId: string | null;
  onSelect: (id: string) => void;
  label: string;
  /**
   * Show only the chosen source, centred.
   *
   * The row is a question, and once a sign-in is running it has been answered —
   * leaving the alternative on screen invites a press that would have to cancel
   * a live server session to honour. Collapsing says the choice is made without
   * disabling anything, which reads better than a greyed-out tile.
   */
  collapsed?: boolean;
  /**
   * The row is returning to its default. Only changes how long the selected
   * styling takes to leave — see the tile's own note.
   */
  settling?: boolean;
}) {
  const tiles = useRef(new Map<string, HTMLButtonElement>());

  /**
   * Arrow keys move the selection and the focus together, which is what a
   * radio group is expected to do — without it the role would be announced and
   * then not behave, which is worse than plain buttons. Selection wraps at both
   * ends; three tiles is short enough that stopping at the edges just reads as
   * the key having failed.
   */
  const moveSelection = (delta: number) => {
    if (sources.length === 0) return;
    const current = sources.findIndex((source) => source.id === selectedId);
    // Nothing picked yet: either arrow enters the row from the near end.
    const from = current === -1 ? (delta > 0 ? -1 : 0) : current;
    const next = (from + delta + sources.length) % sources.length;
    const target = sources[next]!;
    onSelect(target.id);
    tiles.current.get(target.id)?.focus();
  };

  const moreSelected = more?.sources.find((source) => source.id === selectedId) ?? null;
  // Collapsed, the chosen source is just a statement — whichever list it came
  // from — so it is drawn as an ordinary tile, not as the picker.
  const shown = collapsed
    ? [...sources, ...(moreSelected ? [moreSelected] : [])].filter((source) => source.id === selectedId)
    : sources;
  const showMore = !collapsed && more !== undefined && more.sources.length > 0;

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("flex items-start gap-3", collapsed && "justify-center")}
      onKeyDown={(event) => {
        // Collapsed, the row is a statement rather than a choice; arrow keys
        // would move a selection that is no longer being asked for.
        if (collapsed) return;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          moveSelection(1);
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          moveSelection(-1);
        }
      }}
    >
      {/*
        `popLayout` takes the leaving tile out of flow at once, so the survivor's
        `layout` animation targets its final centred position rather than
        chasing a gap that is still closing.

        The wrapper carries the width, not the tile: held at the width it had
        with two in the row, so the kept tile travels without also growing.
      */}
      <AnimatePresence initial={false} mode="popLayout">
        {shown.map((source) => (
          <motion.div
            key={source.id}
            layout
            transition={SOURCE_COLLAPSE_MOVE}
            exit={{ opacity: 0, transition: SOURCE_EXIT_FADE }}
            className={cn(
              "flex min-w-0",
              collapsed ? "w-(--sz-source-tile-two-up)" : "flex-1",
            )}
          >
            <ModelSourceTile
              source={source}
              mode={mode}
              selected={source.id === selectedId}
              onSelect={() => onSelect(source.id)}
              settling={settling}
              buttonRef={(node) => {
                if (node) tiles.current.set(source.id, node);
                else tiles.current.delete(source.id);
              }}
            />
          </motion.div>
        ))}
        {showMore && (
          <motion.div
            key="__more__"
            layout
            transition={SOURCE_COLLAPSE_MOVE}
            exit={{ opacity: 0, transition: SOURCE_EXIT_FADE }}
            className="flex min-w-0 flex-1"
          >
            <MoreSourcesTile
              more={more}
              mode={mode}
              selected={moreSelected}
              onSelect={onSelect}
              settling={settling}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
