import { setStoredLanguage } from "@/lib/i18n";
beforeEach(() => setStoredLanguage("en"));
import { beforeEach, describe, expect, it } from "vitest";

import {
  formatCompactNumber,
  formatListingPrice,
  formatRentPeriod,
  formatDate,
  formatDateTime,
  formatFullDate,
  formatRelativeTime,
  formatTime,
} from "./formatters";

describe("formatCompactNumber", () => {
  it("shortens thousands and millions", () => {
    expect(formatCompactNumber(1240)).toBe("1.2K");
    expect(formatCompactNumber(2_000_000)).toBe("2M");
  });

  it("leaves small numbers intact", () => {
    expect(formatCompactNumber(42)).toBe("42");
  });
});

describe("date formatters", () => {
  const iso = "2026-07-23T14:30:00.000Z";

  it("formats a short date", () => {
    expect(formatDate(iso)).toBe("Jul 23, 2026");
  });

  it("formats a full, spelled-out date", () => {
    expect(formatFullDate(iso)).toBe("Thursday, July 23, 2026");
  });

  it("includes the time in a date-time", () => {
    expect(formatDateTime(iso)).toMatch(/Jul 23, 2026/);
    expect(formatDateTime(iso)).toMatch(/\d{1,2}:\d{2}/);
  });

  it("formats just the time, with no date", () => {
    expect(formatTime(iso)).toMatch(/^\d{1,2}:\d{2}\s?[AP]M$/);
  });
});

describe("formatRelativeTime", () => {
  const now = new Date("2026-07-23T12:00:00.000Z").getTime();

  it("describes past times", () => {
    expect(formatRelativeTime("2026-07-23T10:00:00.000Z", now)).toBe(
      "2 hours ago",
    );
    expect(formatRelativeTime("2026-07-21T12:00:00.000Z", now)).toBe(
      "2 days ago",
    );
  });

  it("describes future times", () => {
    expect(formatRelativeTime("2026-07-23T15:00:00.000Z", now)).toBe(
      "in 3 hours",
    );
    expect(formatRelativeTime("2026-07-26T12:00:00.000Z", now)).toBe(
      "in 3 days",
    );
  });

  it("uses 'auto' phrasing for the immediate day boundary", () => {
    expect(formatRelativeTime("2026-07-24T12:00:00.000Z", now)).toBe(
      "tomorrow",
    );
    expect(formatRelativeTime("2026-07-22T12:00:00.000Z", now)).toBe(
      "yesterday",
    );
  });
});

describe("listing monetary terms", () => {
  it.each([
    ["DAY", "/day", "/jour"],
    ["WEEK", "/week", "/semaine"],
    ["MONTH", "/month", "/mois"],
    ["YEAR", "/year", "/an"],
  ])(
    "localizes %s without changing the amount or currency",
    (rentPeriod, en, fr) => {
      const property = {
        price: 175000,
        currencyCode: "XOF",
        listingType: "RENT" as const,
        rentPeriod: rentPeriod as "DAY",
      };
      expect(formatListingPrice(property, "en")).toContain(en);
      expect(formatListingPrice(property, "fr")).toContain(fr);
      expect(formatListingPrice(property, "en")).toContain("175,000");
    },
  );
  it("does not add a recurring period to a sale", () => {
    expect(
      formatListingPrice(
        {
          price: 42,
          currencyCode: "EUR",
          listingType: "SALE",
          rentPeriod: "MONTH",
        },
        "en",
      ),
    ).toBe("€42");
  });
  it("does not invent missing legacy currency or rental terms", () => {
    expect(
      formatListingPrice(
        {
          price: 42,
          currencyCode: null,
          listingType: "RENT",
          rentPeriod: null,
        },
        "en",
      ),
    ).toBe("42 (currency unconfirmed) (period unconfirmed)");
    expect(formatRentPeriod(null, "fr")).toBe("(période à confirmer)");
    expect(formatRentPeriod("UNKNOWN", "en")).toBe("(period unconfirmed)");
  });
});
