import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { dashboardService } from "@/services";
import { makeProperty } from "@/test/fixtures";
import { renderWithQueryClient } from "@/test/renderWithQueryClient";

import { RecentListings } from "./RecentListings";

vi.mock("@/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services")>();
  return {
    ...actual,
    dashboardService: { getRecentListings: vi.fn() },
  };
});

const getRecentListings = vi.mocked(dashboardService.getRecentListings);

describe("RecentListings", () => {
  beforeEach(() => getRecentListings.mockReset());

  it("renders each listing with its status once loaded", async () => {
    getRecentListings.mockResolvedValue([
      makeProperty({
        id: "dl1",
        title: "Luxury 3BR Apartment",
        status: "ACTIVE",
        updatedAt: "2026-07-23T10:00:00.000Z",
      }),
      makeProperty({
        id: "dl2",
        title: "Cantonments Draft",
        status: "DRAFT",
        updatedAt: "2026-07-20T10:00:00.000Z",
      }),
    ]);

    renderWithQueryClient(<RecentListings />);

    await waitFor(() =>
      expect(screen.getByText("Luxury 3BR Apartment")).toBeInTheDocument(),
    );
    expect(screen.getByText("Cantonments Draft")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  it("preserves a listing's currency and recurring period", async () => {
    getRecentListings.mockResolvedValue([
      makeProperty({
        title: "Weekly rental",
        price: 200,
        currencyCode: "EUR",
        listingType: "RENT",
        rentPeriod: "WEEK",
      }),
      makeProperty({
        id: "legacy",
        title: "Legacy listing",
        price: 42,
        currencyCode: null,
      }),
    ]);
    renderWithQueryClient(<RecentListings />);
    expect(await screen.findByText(/€200 \/week/)).toBeInTheDocument();
    expect(screen.getByText(/42 \(currency unconfirmed\)/)).toBeInTheDocument();
  });

  it("shows an empty state when there are no listings", async () => {
    getRecentListings.mockResolvedValue([]);

    renderWithQueryClient(<RecentListings />);

    await waitFor(() =>
      expect(screen.getByText("No listings yet")).toBeInTheDocument(),
    );
  });

  // Error-state coverage lives in the full-page integration test — see the note
  // in DashboardKpis.test.tsx.
});
