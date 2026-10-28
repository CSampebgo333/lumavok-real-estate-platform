import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { AxiosError, AxiosHeaders } from "axios";
import { setStoredLanguage } from "@/lib/locale";
import { useAuthStore } from "@/store/authStore";
const calls: {
  method?: string;
  url?: string;
  params: Record<string, unknown>;
  body: unknown;
}[] = [];
let response: unknown;
let failure: number | undefined;
const originalAdapter = api.defaults.adapter;
beforeEach(() => {
  calls.length = 0;
  response = { id: "canonical-id" };
  failure = undefined;
  useAuthStore.getState().clearAuth();
  api.defaults.adapter = async (config) => {
    calls.push({
      method: config.method,
      url: config.url,
      params: config.params,
      body: config.data ? JSON.parse(config.data) : undefined,
    });
    if (failure)
      throw new AxiosError(
        "Request failed",
        "ERR_BAD_RESPONSE",
        config,
        undefined,
        {
          status: failure,
          statusText: "Failed",
          data: { success: false, code: "CONFLICT" },
          headers: new AxiosHeaders(),
          config,
        },
      );
    return {
      data: { success: true, data: response },
      status: 200,
      statusText: "OK",
      headers: new AxiosHeaders(),
      config,
    };
  };
});
afterEach(() => {
  api.defaults.adapter = originalAdapter;
  vi.restoreAllMocks();
});
import { propertyService } from "./property.service";

type Case = [
  string,
  () => Promise<unknown>,
  string,
  string,
  unknown?,
  Record<string, unknown>?,
];
const cases: Case[] = [
  [
    "list defaults",
    () => propertyService.getProperties(),
    "get",
    "/properties",
    undefined,
    { page: 1, pageSize: 12 },
  ],
  [
    "all filters",
    () =>
      propertyService.getProperties({
        page: 2,
        pageSize: 5,
        q: "Maison",
        category: "house",
        listingType: "RENT",
        city: "Ouagadougou",
        minPrice: 0,
        maxPrice: 200000,
        minBedrooms: 2,
        sort: "price_desc",
      }),
    "get",
    "/properties",
    undefined,
    {
      page: 2,
      pageSize: 5,
      q: "Maison",
      category: "house",
      listingType: "RENT",
      city: "Ouagadougou",
      minPrice: 0,
      maxPrice: 200000,
      minBedrooms: 2,
      sort: "price_desc",
    },
  ],
  [
    "encoded slug",
    () => propertyService.getPropertyBySlug("maison / soleil"),
    "get",
    "/properties/maison%20%2F%20soleil",
  ],
];
describe("HTTP adapter contract", () => {
  it.each(cases)("%s", async (_name, call, method, url, body, params) => {
    const result = await call();
    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual({
      method,
      url,
      body,
      params: { lang: "en", ...params },
    });
    if (method !== "delete") expect(result).toEqual(response);
  });
  it.each([400, 403, 404, 409, 500, 503])(
    "propagates HTTP %s for visible error handling",
    async (status) => {
      failure = status;
      await expect(cases[0][1]()).rejects.toMatchObject({
        response: { status },
      });
    },
  );
  it("sends the selected French language", async () => {
    setStoredLanguage("fr");
    await cases[0][1]();
    expect(calls[0].params.lang).toBe("fr");
  });
});

it("returns immediately for an empty shortlist", async () => {
  expect(await propertyService.getPropertiesByIds([])).toEqual([]);
  expect(calls).toHaveLength(0);
});
it("ignores only delisted 404s", async () => {
  failure = 404;
  expect(await propertyService.getPropertiesByIds(["missing"])).toEqual([]);
});
it("surfaces an outage instead of displaying an empty shortlist", async () => {
  failure = 503;
  await expect(
    propertyService.getPropertiesByIds(["p1"]),
  ).rejects.toMatchObject({ response: { status: 503 } });
});
it("encodes property IDs", async () => {
  expect(await propertyService.getPropertiesByIds(["a/b"])).toEqual([response]);
  expect(calls[0].url).toBe("/properties/by-id/a%2Fb");
});
