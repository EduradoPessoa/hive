/**
 * Obsidian-style `[[target]]` / `[[target|label]]` wikilinks, shared by every
 * place that reads them: the Markdown renderer (which turns them into links),
 * the Memory reader (which decides where a link goes) and the Memory graph
 * (which derives connections from them). Keeping the parsing and resolution
 * rules here is what makes a link the reader opens and an edge the graph draws
 * point at the same document.
 */

export interface ParsedWikiLink {
  target: string;
  label: string;
}

/** Matches one `[[…]]` token inside a single line of plain text. */
export const WIKI_LINK_PATTERN = /\[\[([^\]\r\n]+)\]\]/g;

/**
 * Markdown AST parents whose text is never scanned for wikilinks: text that is
 * already a link (or an image/definition) must not grow a second link inside.
 * Code is excluded implicitly — it is `code`/`inlineCode`, never `text`.
 */
export const WIKI_LINK_SKIP_PARENT_TYPES: ReadonlySet<string> = new Set([
  "definition",
  "image",
  "imageReference",
  "link",
  "linkReference",
]);

/** Splits the inside of `[[…]]` into target and label; null when unusable. */
export function parseWikiLinkBody(body: string): ParsedWikiLink | null {
  const [rawTarget, ...rawLabelParts] = body.split("|");
  const target = rawTarget?.trim() ?? "";
  const label = rawLabelParts.length > 0 ? rawLabelParts.join("|").trim() : target;
  if (!target || target.includes("[") || target.includes("]")) return null;
  return { target, label: label || target };
}

/** Every usable wikilink target in one text node, in order of appearance. */
export function wikiLinkTargetsInText(value: string): string[] {
  const targets: string[] = [];
  for (const match of value.matchAll(WIKI_LINK_PATTERN)) {
    const parsed = parseWikiLinkBody(match[1] ?? "");
    if (parsed) targets.push(parsed.target);
  }
  return targets;
}

/**
 * The slug form of a name: accents folded, lowercase, runs of anything else
 * collapsed to single hyphens. Matches how memory document slugs are minted.
 * Returns "" when nothing slug-worthy is left.
 */
export function normalizeMemorySlug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

export interface MemoryWikiLinkCandidate {
  id: string;
  title: string;
  slug: string;
}

/**
 * Builds the one resolver both the reader and the graph use.
 *
 * A target resolves by normalized slug first — slugs are unique per company,
 * so that match is exact — then by title, case-insensitively. When several
 * documents share that title the link is ambiguous and resolves to nothing
 * rather than to whichever row happens to come first.
 */
export function createMemoryWikiLinkResolver(
  documents: readonly MemoryWikiLinkCandidate[],
): (target: string) => string | null {
  const bySlug = new Map<string, string>();
  const byTitle = new Map<string, string | null>();
  for (const document of documents) {
    bySlug.set(document.slug, document.id);
    const titleKey = document.title.trim().toLowerCase();
    // A second document with the same title poisons the key.
    byTitle.set(titleKey, byTitle.has(titleKey) ? null : document.id);
  }
  return (target: string) => {
    const trimmed = target.trim();
    if (!trimmed) return null;
    const titleMatch = byTitle.get(trimmed.toLowerCase());
    const slug = normalizeMemorySlug(trimmed);
    const slugMatch = slug ? bySlug.get(slug) : undefined;
    if (slugMatch) {
      // Duplicate titles mint `name`, `name-2`…, so the title's slug would
      // quietly pick the first of them. Only a target written as that exact
      // slug is unambiguous then.
      if (titleMatch === null && trimmed !== slug) return null;
      return slugMatch;
    }
    return titleMatch ?? null;
  };
}
