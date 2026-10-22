// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { FolderListItem, MemoryDocumentListItem } from "@paperclipai/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryTree, type MemoryTreeProps } from "./MemoryTree";
import { buildMemoryTree } from "./memory-tree";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function folder(id: string, name: string): FolderListItem {
  return {
    id, companyId: "c1", kind: "memory", parentId: null, name, slug: name.toLowerCase(),
    systemKey: null, path: name.toLowerCase(), depth: 1, color: null, position: 0, itemCount: 0,
    createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01"),
  };
}

function document_(id: string, title: string, folderId: string | null): MemoryDocumentListItem {
  return {
    id, companyId: "c1", folderId, title, slug: title.toLowerCase(),
    createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01"),
  };
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  // Release any drag a test left running, so listeners do not leak into the next.
  act(() => {
    window.document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  });
  // dnd-kit arms a one-shot click suppressor on the next tick after a drag ends
  // (so dropping is not read as a click). Let it arm, then spend it here so it
  // cannot eat the first click of the next test.
  await new Promise((resolve) => setTimeout(resolve, 0));
  act(() => {
    window.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
  act(() => root.unmount());
  container.remove();
});

function renderTree(documents: MemoryDocumentListItem[], expandAll = true) {
  const folders = [folder("f1", "Alpha"), folder("f2", "Beta")];
  const props: MemoryTreeProps = {
    model: buildMemoryTree(folders, documents),
    selectedDocumentId: null,
    onSelectDocument: vi.fn(),
    onCreateFolder: vi.fn(),
    onCreateDocument: vi.fn(),
    onRenameFolder: vi.fn(),
    onDeleteFolder: vi.fn(),
    onRenameDocument: vi.fn(),
    onDeleteDocument: vi.fn(),
    onMoveDocument: vi.fn(),
    onMoveFolder: vi.fn(),
  };
  act(() => root.render(<MemoryTree {...props} />));
  if (expandAll) {
    for (const row of container.querySelectorAll<HTMLElement>('[data-testid="memory-folder-row"]')) {
      act(() => row.click());
    }
  }
  return props;
}

/** MouseSensor starts after 8px of movement; this drags the row by 20px. */
function startDrag(row: Element) {
  act(() => {
    row.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: 10, clientY: 10, button: 0 }));
  });
  act(() => {
    window.document.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 30, clientY: 30 }));
  });
}

describe("MemoryTree drag feedback", () => {
  it("shows a preview with the node's icon and name while dragging a document", () => {
    renderTree([document_("d1", "Runbook", "f1")]);
    expect(container.querySelector('[data-testid="memory-drag-preview"]')).toBeNull();

    startDrag(container.querySelector('[data-testid="memory-document-row"]')!);

    const preview = window.document.querySelector('[data-testid="memory-drag-preview"]');
    expect(preview?.textContent).toBe("Runbook");
    expect(preview?.querySelector("svg")).not.toBeNull();
  });

  it("previews a folder by its name", () => {
    renderTree([], false);
    startDrag(container.querySelectorAll('[data-testid="memory-folder-row"]')[0]!.firstElementChild!);

    expect(window.document.querySelector('[data-testid="memory-drag-preview"]')?.textContent).toBe("Alpha");
  });

  it("offers the 'move out of folder' area for a nested document", () => {
    renderTree([document_("d1", "Runbook", "f1")]);
    startDrag(container.querySelector('[data-testid="memory-document-row"]')!);

    expect(container.querySelector('[data-testid="memory-root-drop-zone"]')).not.toBeNull();
  });

  it("does not offer it for a document that is already at the root", () => {
    renderTree([document_("d1", "Runbook", null)]);
    startDrag(container.querySelector('[data-testid="memory-document-row"]')!);

    expect(window.document.querySelector('[data-testid="memory-drag-preview"]')?.textContent).toBe("Runbook");
    expect(container.querySelector('[data-testid="memory-root-drop-zone"]')).toBeNull();
  });
});
