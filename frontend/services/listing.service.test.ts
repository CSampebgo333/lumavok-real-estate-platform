import { describe, expect, it } from "vitest";
import type { PropertyStatus } from "@/types";
import { canDeleteListing, getAvailableTransitions, isPubliclyVisible, PUBLICLY_VISIBLE_STATUSES } from "./listing.service";

describe("status transitions", () => {
  it("DRAFT can only publish", () => {
    expect(getAvailableTransitions("DRAFT")).toEqual([
      { target: "ACTIVE", label: "Publish" },
    ]);
  });

  it("SOLD is terminal", () => {
    expect(getAvailableTransitions("SOLD")).toEqual([]);
  });

  it("only DRAFT and SUSPENDED are deletable", () => {
    expect(canDeleteListing("DRAFT")).toBe(true);
    expect(canDeleteListing("SUSPENDED")).toBe(true);
    expect(canDeleteListing("ACTIVE")).toBe(false);
    expect(canDeleteListing("RESERVED")).toBe(false);
    expect(canDeleteListing("SOLD")).toBe(false);
  });
});

describe("isPubliclyVisible", () => {
  it("is true only for ACTIVE", () => {
    expect(isPubliclyVisible("ACTIVE")).toBe(true);
  });

  it("is false for a DRAFT, which has no public page by design", () => {
    expect(isPubliclyVisible("DRAFT")).toBe(false);
  });

  it.each(["SUSPENDED", "SOLD", "RESERVED"] as const)(
    "is false for %s",
    (status) => {
      expect(isPubliclyVisible(status)).toBe(false);
    },
  );

  it("covers every PropertyStatus, so a new status can't default to public", () => {
    const allStatuses: PropertyStatus[] = [
      "ACTIVE",
      "RESERVED",
      "SOLD",
      "DRAFT",
      "SUSPENDED",
    ];
    for (const status of allStatuses) {
      expect(typeof isPubliclyVisible(status)).toBe("boolean");
    }
    expect(PUBLICLY_VISIBLE_STATUSES.size).toBe(1);
  });
});
