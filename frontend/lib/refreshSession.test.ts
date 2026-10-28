import axios, {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { refreshSession } from "./refreshSession";
import { api } from "./api";
import { watchAuthQueryCache } from "./authQueryCache";
import { useAuthStore } from "@/store/authStore";
import type { User } from "@/types";
const user: User = {
  id: "buyer",
  email: "buyer@example.test",
  fullName: "Test Buyer",
  role: "USER",
};
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { resolve, promise };
}
const sessionResponse = (u: User = user, token = "new-token") => ({
  data: { data: { user: u, accessToken: token } },
});
const initialAdapter = api.defaults.adapter;
beforeEach(() => {
  useAuthStore.getState().clearAuth();
  useAuthStore.getState().setBootstrapped();
});
afterEach(() => {
  vi.restoreAllMocks();
  api.defaults.adapter = initialAdapter;
});
describe("session refresh isolation", () => {
  it("shares one request between concurrent consumers and maps the server role", async () => {
    const pending = deferred<ReturnType<typeof sessionResponse>>();
    const post = vi.spyOn(axios, "post").mockReturnValue(pending.promise);
    const one = refreshSession(),
      two = refreshSession();
    expect(one).toBe(two);
    pending.resolve(
      sessionResponse({
        ...user,
        role: "PROPERTY_DEVELOPER" as User["role"],
        developerId: "dev",
      }),
    );
    expect((await one).user.role).toBe("DEVELOPER");
    expect(post).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().accessToken).toBe("new-token");
  });
  it("never restores an older response after logout", async () => {
    useAuthStore.getState().setAuth(user, "old");
    const pending = deferred<ReturnType<typeof sessionResponse>>();
    vi.spyOn(axios, "post").mockReturnValue(pending.promise);
    const result = refreshSession();
    useAuthStore.getState().clearAuth();
    pending.resolve(sessionResponse());
    await expect(result).rejects.toThrow("Session changed");
    expect(useAuthStore.getState().user).toBeNull();
  });
  it("never overwrites a newer login with a previous account", async () => {
    const pending = deferred<ReturnType<typeof sessionResponse>>();
    vi.spyOn(axios, "post").mockReturnValue(pending.promise);
    const result = refreshSession();
    useAuthStore.getState().setAuth({ ...user, id: "other" }, "other-token");
    pending.resolve(sessionResponse());
    await expect(result).rejects.toThrow("Session changed");
    expect(useAuthStore.getState().accessToken).toBe("other-token");
  });
  it("keeps the account during a temporary refresh outage and clears it for an ended session", async () => {
    useAuthStore.getState().setAuth(user, "expired");
    api.defaults.adapter = async (config) => {
      throw new AxiosError("Expired", "ERR_BAD_REQUEST", config, undefined, {
        status: 401,
        statusText: "Unauthorized",
        data: {},
        headers: {},
        config,
      });
    };
    const error = (status: number) =>
      new AxiosError(
        "Fixture error",
        "ERR_BAD_RESPONSE",
        undefined,
        undefined,
        {
          status,
          statusText: "",
          data: {},
          headers: {},
          config: { headers: new AxiosHeaders() } as InternalAxiosRequestConfig,
        },
      );
    const post = vi.spyOn(axios, "post").mockRejectedValue(error(503));
    await expect(api.get("/favorites")).rejects.toHaveProperty(
      "response.status",
      503,
    );
    expect(useAuthStore.getState().user?.id).toBe("buyer");
    post.mockRejectedValue(error(401));
    await expect(api.get("/favorites")).rejects.toHaveProperty(
      "response.status",
      401,
    );
    expect(useAuthStore.getState().user).toBeNull();
  });
  it("does not replay a mutation under a different refreshed account", async () => {
    useAuthStore.getState().setAuth(user, "expired");
    let calls = 0;
    api.defaults.adapter = async (config) => {
      calls++;
      throw new AxiosError("Expired", "ERR_BAD_REQUEST", config, undefined, {
        status: 401,
        statusText: "",
        data: {},
        headers: {},
        config,
      });
    };
    vi.spyOn(axios, "post").mockResolvedValue(
      sessionResponse({ ...user, id: "other" }),
    );
    await expect(api.post("/favorites", { propertyId: "p1" })).rejects.toThrow(
      "Session changed",
    );
    expect(calls).toBe(1);
  });
});
describe("private query cache", () => {
  it("clears responses for account and role changes while retaining them for token rotation", () => {
    const client = new QueryClient();
    useAuthStore.getState().setAuth(user, "one");
    const stop = watchAuthQueryCache(client);
    try {
      client.setQueryData(["private"], "buyer-data");
      useAuthStore.getState().setAuth(user, "two");
      expect(client.getQueryData(["private"])).toBe("buyer-data");
      useAuthStore
        .getState()
        .setAuth({ ...user, role: "DEVELOPER", developerId: "dev" }, "three");
      expect(client.getQueryData(["private"])).toBeUndefined();
      client.setQueryData(["private"], "seller-data");
      useAuthStore.getState().setAuth({ ...user, id: "other" }, "four");
      expect(client.getQueryData(["private"])).toBeUndefined();
      client.setQueryData(["private"], "other-data");
      useAuthStore.getState().clearAuth();
      expect(client.getQueryData(["private"])).toBeUndefined();
    } finally {
      stop();
      client.clear();
    }
  });
});
