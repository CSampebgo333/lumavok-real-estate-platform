import { renderHook, waitFor, act } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useAuthBootstrap } from "./useAuthBootstrap";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services";
vi.mock("@/services", () => ({ authService: { refresh: vi.fn() } }));
it("does not let an obsolete bootstrap error block a newer authenticated session", async () => {
  useAuthStore.getState().clearAuth();
  useAuthStore.setState({ isBootstrapping: true });
  let reject!: (error: Error) => void;
  vi.mocked(authService.refresh).mockReturnValue(
    new Promise((_resolve, fail) => {
      reject = fail;
    }),
  );
  const { unmount } = renderHook(useAuthBootstrap);
  await act(async () => {
    useAuthStore
      .getState()
      .setAuth(
        { id: "new", email: "new@example.test", fullName: "New", role: "USER" },
        "new-token",
      );
    reject(new Error("Session changed"));
  });
  await waitFor(() =>
    expect(useAuthStore.getState().isBootstrapping).toBe(false),
  );
  expect(useAuthStore.getState().bootstrapError).toBeNull();
  expect(useAuthStore.getState().accessToken).toBe("new-token");
  unmount();
});
