import { describe, expect, it } from "vitest";
import {
  createMemoryWikiLinkResolver,
  normalizeMemorySlug,
  parseWikiLinkBody,
  wikiLinkTargetsInText,
} from "./memory-wikilinks.js";

describe("parseWikiLinkBody", () => {
  it("splits target and label", () => {
    expect(parseWikiLinkBody("Target")).toEqual({ target: "Target", label: "Target" });
    expect(parseWikiLinkBody(" Target | Shown ")).toEqual({ target: "Target", label: "Shown" });
  });

  it("rejects empty or bracketed targets", () => {
    expect(parseWikiLinkBody(" |label")).toBeNull();
    expect(parseWikiLinkBody("a[b")).toBeNull();
  });
});

describe("wikiLinkTargetsInText", () => {
  it("finds every target, including labelled ones", () => {
    expect(wikiLinkTargetsInText("See [[A]] and [[B|the b]], then [[A]] again"))
      .toEqual(["A", "B", "A"]);
  });
});

describe("normalizeMemorySlug", () => {
  it("folds accents and punctuation", () => {
    expect(normalizeMemorySlug("Decisões de Banco!")).toBe("decisoes-de-banco");
    expect(normalizeMemorySlug("!!!")).toBe("");
  });
});

describe("createMemoryWikiLinkResolver", () => {
  const resolve = createMemoryWikiLinkResolver([
    { id: "db", title: "Database Decisions", slug: "database-decisions" },
    { id: "renamed", title: "New Name", slug: "old-name" },
    { id: "dup-1", title: "Notes", slug: "notes" },
    { id: "dup-2", title: "notes", slug: "notes-2" },
  ]);

  it("resolves by normalized slug first", () => {
    expect(resolve("database-decisions")).toBe("db");
    expect(resolve("Database Decisions")).toBe("db");
    expect(resolve("Database   decisions")).toBe("db");
  });

  it("keeps a renamed document reachable by its preserved slug and its new title", () => {
    expect(resolve("old-name")).toBe("renamed");
    expect(resolve("new name")).toBe("renamed");
  });

  it("refuses ambiguous titles instead of picking one", () => {
    expect(resolve("Notes")).toBeNull();
    expect(resolve("NOTES")).toBeNull();
  });

  it("still resolves an ambiguous title's documents by their exact slugs", () => {
    expect(resolve("notes")).toBe("dup-1");
    expect(resolve("notes-2")).toBe("dup-2");
  });

  it("returns null for unknown or empty targets", () => {
    expect(resolve("Missing")).toBeNull();
    expect(resolve("   ")).toBeNull();
  });
});
