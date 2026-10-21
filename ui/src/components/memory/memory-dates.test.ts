import { describe, expect, it } from "vitest";
import { formatMemoryTimestamp } from "./memory-dates";

describe("formatMemoryTimestamp", () => {
  it("formats in Brasília time as DD/MM/YYYY HH:mm", () => {
    // 17:32 UTC is 14:32 in São Paulo (UTC-3).
    expect(formatMemoryTimestamp("2026-10-21T17:32:00.000Z")).toBe("21/10/2026 14:32");
    expect(formatMemoryTimestamp(new Date("2026-01-05T03:07:00.000Z"))).toBe("05/01/2026 00:07");
  });

  it("returns null for missing or invalid values", () => {
    expect(formatMemoryTimestamp(null)).toBeNull();
    expect(formatMemoryTimestamp(undefined)).toBeNull();
    expect(formatMemoryTimestamp("not a date")).toBeNull();
  });
});
