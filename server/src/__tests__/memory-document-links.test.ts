import { describe, expect, it } from "vitest";
import { extractWikiLinkTargets } from "../services/memory-document-links.js";

describe("extractWikiLinkTargets", () => {
  it("finds plain and labelled wikilinks in prose, lists and tables", () => {
    const markdown = [
      "# Title",
      "",
      "See [[Alpha]] and [[Beta|the beta doc]].",
      "",
      "- item with [[Gamma]]",
      "",
      "| a | b |",
      "|---|---|",
      "| [[Delta]] | x |",
    ].join("\n");
    expect(extractWikiLinkTargets(markdown)).toEqual(["Alpha", "Beta", "Gamma", "Delta"]);
  });

  it("ignores wikilinks inside code spans, fenced code and existing links", () => {
    const markdown = [
      "Inline `[[NotInline]]` code.",
      "",
      "```",
      "[[NotFenced]]",
      "```",
      "",
      "    [[NotIndented]]",
      "",
      "[a [[NotInLink]] label](https://example.com)",
      "",
      "Real [[Kept]].",
    ].join("\n");
    expect(extractWikiLinkTargets(markdown)).toEqual(["Kept"]);
  });

  it("returns repeats as written; deduplication is the graph's job", () => {
    expect(extractWikiLinkTargets("[[A]] [[A]] [[A|again]]")).toEqual(["A", "A", "A"]);
  });

  it("returns nothing for documents without wikilinks", () => {
    expect(extractWikiLinkTargets("")).toEqual([]);
    expect(extractWikiLinkTargets("plain [text](url) only")).toEqual([]);
  });
});
