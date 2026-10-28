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
import { appointmentService } from "./appointment.service";

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
    () => appointmentService.getAppointments(),
    "get",
    "/developers/me/appointments",
    undefined,
    { page: 1, pageSize: 10 },
  ],
  [
    "filters and paging",
    () =>
      appointmentService.getAppointments({
        page: 2,
        pageSize: 25,
        q: "A",
        status: "REQUESTED",
        timeframe: "overdue",
        sort: "date_desc",
      }),
    "get",
    "/developers/me/appointments",
    undefined,
    {
      page: 2,
      pageSize: 25,
      q: "A",
      status: "REQUESTED",
      timeframe: "overdue",
      sort: "date_desc",
    },
  ],
  [
    "counts",
    () => appointmentService.getStatusCounts(),
    "get",
    "/developers/me/appointments/counts",
  ],
  [
    "detail",
    () => appointmentService.getAppointment("a1"),
    "get",
    "/developers/me/appointments/a1",
  ],
  [
    "confirm",
    () => appointmentService.updateStatus("a1", "CONFIRMED"),
    "patch",
    "/developers/me/appointments/a1/status",
    { status: "CONFIRMED" },
  ],
  [
    "reschedule",
    () => appointmentService.reschedule("a1", "2027-01-01T10:00:00Z"),
    "patch",
    "/developers/me/appointments/a1/reschedule",
    { scheduledFor: "2027-01-01T10:00:00Z" },
  ],
  [
    "bulk",
    () => appointmentService.bulkUpdateStatus(["a1", "a2"], "COMPLETED"),
    "patch",
    "/developers/me/appointments/bulk-status",
    { ids: ["a1", "a2"], status: "COMPLETED" },
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
