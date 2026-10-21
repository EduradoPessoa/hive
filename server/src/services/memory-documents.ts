import { and, asc, eq } from "drizzle-orm";
import type { Db } from "@paperclipai/db";
import { folders, memoryDocuments } from "@paperclipai/db";
import { createMemoryWikiLinkResolver } from "@paperclipai/shared";
import type {
  CreateMemoryDocument,
  MemoryDocument,
  MemoryDocumentGraph,
  MemoryDocumentGraphLink,
  MemoryDocumentListResult,
  MoveMemoryDocument,
  UpdateMemoryDocument,
} from "@paperclipai/shared";
import { conflict, notFound, unprocessable } from "../errors.js";
import { normalizeFolderSlug } from "./folders.js";
import { extractWikiLinkTargets } from "./memory-document-links.js";

type MemoryDocumentRow = typeof memoryDocuments.$inferSelect;

const MAX_SLUG_ATTEMPTS = 50;

function isPostgresError(error: unknown, code: string) {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

function toDocument(row: MemoryDocumentRow): MemoryDocument {
  return {
    id: row.id,
    companyId: row.companyId,
    folderId: row.folderId ?? null,
    title: row.title,
    slug: row.slug,
    markdown: row.markdown,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function memoryDocumentService(db: Db) {
  async function assertMemoryFolder(companyId: string, folderId: string) {
    const folder = await db
      .select({ id: folders.id, kind: folders.kind })
      .from(folders)
      .where(and(eq(folders.companyId, companyId), eq(folders.id, folderId)))
      .then((rows) => rows[0] ?? null);
    if (!folder) throw notFound("Folder not found");
    if (folder.kind !== "memory") throw unprocessable("Folder kind must be memory");
  }

  /** Slugs are company-wide unique so `[[wikilinks]]` can resolve by name alone. */
  async function uniqueSlug(companyId: string, baseSlug: string) {
    const taken = new Set(
      (await db
        .select({ slug: memoryDocuments.slug })
        .from(memoryDocuments)
        .where(eq(memoryDocuments.companyId, companyId)))
        .map((row) => row.slug),
    );
    if (!taken.has(baseSlug)) return baseSlug;
    for (let suffix = 2; suffix <= MAX_SLUG_ATTEMPTS; suffix++) {
      const candidate = `${baseSlug}-${suffix}`;
      if (!taken.has(candidate)) return candidate;
    }
    throw conflict("Too many memory documents share this title");
  }

  async function list(companyId: string): Promise<MemoryDocumentListResult> {
    const rows = await db
      .select({
        id: memoryDocuments.id,
        companyId: memoryDocuments.companyId,
        folderId: memoryDocuments.folderId,
        title: memoryDocuments.title,
        slug: memoryDocuments.slug,
        createdAt: memoryDocuments.createdAt,
        updatedAt: memoryDocuments.updatedAt,
      })
      .from(memoryDocuments)
      .where(eq(memoryDocuments.companyId, companyId))
      .orderBy(asc(memoryDocuments.title));
    return {
      documents: rows.map((row) => ({ ...row, folderId: row.folderId ?? null })),
      allCount: rows.length,
      unfiledCount: rows.filter((row) => row.folderId === null).length,
    };
  }

  async function get(companyId: string, documentId: string): Promise<MemoryDocument> {
    const row = await db
      .select()
      .from(memoryDocuments)
      .where(and(eq(memoryDocuments.companyId, companyId), eq(memoryDocuments.id, documentId)))
      .then((rows) => rows[0] ?? null);
    if (!row) throw notFound("Memory document not found");
    return toDocument(row);
  }

  /**
   * Resolves a `[[wikilink]]` target with the same rules the reader and the
   * graph use (see `createMemoryWikiLinkResolver`): normalized slug first,
   * then case-insensitive title, and nothing when a title is ambiguous.
   */
  async function resolveByTitle(companyId: string, target: string): Promise<MemoryDocument | null> {
    const candidates = await db
      .select({ id: memoryDocuments.id, title: memoryDocuments.title, slug: memoryDocuments.slug })
      .from(memoryDocuments)
      .where(eq(memoryDocuments.companyId, companyId));
    const documentId = createMemoryWikiLinkResolver(candidates)(target);
    return documentId ? get(companyId, documentId) : null;
  }

  /**
   * Every document as a node and every resolvable `[[wikilink]]` between two
   * of them as a link. One query loads the company's documents; connections
   * are derived from the Markdown in memory, and no body leaves the server.
   * Unresolved targets and self-links are dropped; repeats collapse to one.
   */
  async function graph(companyId: string): Promise<MemoryDocumentGraph> {
    const rows = await db
      .select({
        id: memoryDocuments.id,
        title: memoryDocuments.title,
        slug: memoryDocuments.slug,
        folderId: memoryDocuments.folderId,
        markdown: memoryDocuments.markdown,
      })
      .from(memoryDocuments)
      .where(eq(memoryDocuments.companyId, companyId))
      .orderBy(asc(memoryDocuments.title));
    const resolve = createMemoryWikiLinkResolver(rows);
    const seen = new Set<string>();
    const links: MemoryDocumentGraphLink[] = [];
    for (const row of rows) {
      for (const target of extractWikiLinkTargets(row.markdown)) {
        const targetId = resolve(target);
        if (!targetId || targetId === row.id) continue;
        const key = `${row.id}->${targetId}`;
        if (seen.has(key)) continue;
        seen.add(key);
        links.push({ source: row.id, target: targetId });
      }
    }
    return {
      nodes: rows.map((row) => ({ id: row.id, title: row.title, folderId: row.folderId ?? null })),
      links,
    };
  }

  async function create(companyId: string, input: CreateMemoryDocument): Promise<MemoryDocument> {
    const folderId = input.folderId ?? null;
    if (folderId) await assertMemoryFolder(companyId, folderId);
    const title = input.title.trim();
    const slug = await uniqueSlug(companyId, input.slug?.trim() || normalizeFolderSlug(title));
    try {
      const row = await db
        .insert(memoryDocuments)
        .values({ companyId, folderId, title, slug, markdown: input.markdown ?? "" })
        .returning()
        .then((rows) => rows[0]!);
      return toDocument(row);
    } catch (error) {
      if (isPostgresError(error, "23505")) throw conflict("A memory document with this name already exists");
      throw error;
    }
  }

  async function update(
    companyId: string,
    documentId: string,
    patch: UpdateMemoryDocument,
  ): Promise<MemoryDocument> {
    await get(companyId, documentId);
    const values: Partial<typeof memoryDocuments.$inferInsert> = { updatedAt: new Date() };
    if (patch.title !== undefined) values.title = patch.title.trim();
    if (patch.markdown !== undefined) values.markdown = patch.markdown;
    const row = await db
      .update(memoryDocuments)
      .set(values)
      .where(and(eq(memoryDocuments.companyId, companyId), eq(memoryDocuments.id, documentId)))
      .returning()
      .then((rows) => rows[0]!);
    return toDocument(row);
  }

  async function move(
    companyId: string,
    documentId: string,
    input: MoveMemoryDocument,
  ): Promise<MemoryDocument> {
    await get(companyId, documentId);
    const folderId = input.folderId ?? null;
    if (folderId) await assertMemoryFolder(companyId, folderId);
    const row = await db
      .update(memoryDocuments)
      .set({ folderId, updatedAt: new Date() })
      .where(and(eq(memoryDocuments.companyId, companyId), eq(memoryDocuments.id, documentId)))
      .returning()
      .then((rows) => rows[0]!);
    return toDocument(row);
  }

  async function remove(companyId: string, documentId: string): Promise<MemoryDocument> {
    const row = await db
      .delete(memoryDocuments)
      .where(and(eq(memoryDocuments.companyId, companyId), eq(memoryDocuments.id, documentId)))
      .returning()
      .then((rows) => rows[0] ?? null);
    if (!row) throw notFound("Memory document not found");
    return toDocument(row);
  }

  return { list, get, resolveByTitle, graph, create, update, move, delete: remove };
}
