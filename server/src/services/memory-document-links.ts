import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { gfm } from "micromark-extension-gfm";
import { WIKI_LINK_SKIP_PARENT_TYPES, wikiLinkTargetsInText } from "@paperclipai/shared";

/**
 * The `[[wikilink]]` targets a memory document's Markdown actually renders as
 * links, in order of appearance.
 *
 * Parsed to an AST with the same GFM grammar the reader renders with, so a
 * `[[target]]` inside a code span, a fenced block or an existing link — which
 * the reader shows as literal text — is not counted as a connection here
 * either. Regex over the raw source would count all of them.
 */
type MarkdownNode = { type: string; value?: string; children?: MarkdownNode[] };

export function extractWikiLinkTargets(markdown: string): string[] {
  if (!markdown.includes("[[")) return [];
  const tree = fromMarkdown(markdown, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  });
  const targets: string[] = [];
  const visit = (node: MarkdownNode) => {
    if (node.type === "text") {
      if (node.value?.includes("[[")) targets.push(...wikiLinkTargetsInText(node.value));
      return;
    }
    if (!node.children || WIKI_LINK_SKIP_PARENT_TYPES.has(node.type)) return;
    for (const child of node.children) visit(child);
  };
  visit(tree as MarkdownNode);
  return targets;
}
