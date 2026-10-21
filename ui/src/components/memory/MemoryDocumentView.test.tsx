// @vitest-environment jsdom

import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { MemoryDocument } from "@paperclipai/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "../../context/ThemeContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  MemoryDocumentView,
  memoryDocumentIdFromHref,
  type MemoryDocumentEditState,
} from "./MemoryDocumentView";

vi.mock("@/lib/router", () => ({
  Link: ({ to, children, ...props }: { to: string; children: ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useCaseHref: () => () => null,
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const DOC: MemoryDocument = {
  id: "doc-a",
  companyId: "company-1",
  folderId: null,
  title: "Alpha",
  slug: "alpha",
  markdown: "See [[Beta]] for more.",
  createdAt: new Date("2026-10-21T17:32:00.000Z"),
  updatedAt: new Date("2026-10-21T17:32:00.000Z"),
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function renderView(props: Partial<Parameters<typeof MemoryDocumentView>[0]> = {}) {
  const client = new QueryClient();
  act(() => {
    root.render(
      <QueryClientProvider client={client}>
        <ThemeProvider>
          <TooltipProvider>
            <MemoryDocumentView
              document={DOC}
              saving={false}
              onSave={async () => {}}
              resolveWikiLinkHref={(target) => (target === "Beta" ? "/memory?doc=doc-b" : null)}
              pendingNavigation={null}
              onResolvePendingNavigation={() => {}}
              onDirtyChange={() => {}}
              {...props}
            />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>,
    );
  });
}

describe("memoryDocumentIdFromHref", () => {
  it("reads the doc parameter from relative and absolute hrefs", () => {
    expect(memoryDocumentIdFromHref("/memory?doc=doc-b")).toBe("doc-b");
    expect(memoryDocumentIdFromHref("https://x.test/memory?doc=a%20b")).toBe("a b");
    expect(memoryDocumentIdFromHref("/memory")).toBeNull();
    expect(memoryDocumentIdFromHref(null)).toBeNull();
  });
});

describe("MemoryDocumentView", () => {
  it("opens wikilinks through onOpenDocument instead of navigating", () => {
    const onOpenDocument = vi.fn();
    renderView({ onOpenDocument });

    const link = container.querySelector<HTMLAnchorElement>("a[data-paperclip-wiki-link]");
    expect(link?.textContent).toBe("Beta");
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    act(() => {
      link!.dispatchEvent(click);
    });

    expect(onOpenDocument).toHaveBeenCalledWith("doc-b");
    expect(click.defaultPrevented).toBe(true);
  });

  it("restores an in-progress edit after a remount and reports it as dirty", () => {
    const states: MemoryDocumentEditState[] = [];
    const onDirtyChange = vi.fn();
    renderView({
      initialEditState: { documentId: "doc-a", mode: "edit", draft: "Unsaved draft" },
      onEditStateChange: (state) => states.push(state),
      onDirtyChange,
    });

    expect(container.querySelector("textarea")?.value).toBe("Unsaved draft");
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
    expect(states.at(-1)).toEqual({ documentId: "doc-a", mode: "edit", draft: "Unsaved draft" });
  });

  it("ignores a kept edit that belongs to another document", () => {
    renderView({
      initialEditState: { documentId: "doc-other", mode: "edit", draft: "Other draft" },
    });

    expect(container.querySelector("textarea")).toBeNull();
    expect(container.textContent).toContain("for more.");
  });
});
