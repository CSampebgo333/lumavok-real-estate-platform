import { renderHook, act } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { useAuth } from "./useAuth";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services";
vi.mock("@/services", () => ({ authService: { logout: vi.fn() } }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
beforeEach(() => {
  vi.mocked(authService.logout).mockReset();
  useAuthStore.getState().setAuth(
    {
      id: "buyer",
      email: "buyer@example.test",
      role: "USER",
      fullName: "Buyer",
    },
    "token",
  );
});
it("retains the session if the server cannot revoke it", async () => {
  vi.mocked(authService.logout).mockRejectedValue(new Error("Unavailable"));
  const { result } = renderHook(useAuth);
  await act(() => result.current.logout());
  expect(result.current.isAuthenticated).toBe(true);
});
it("clears the session after confirmed server logout", async () => {
  vi.mocked(authService.logout).mockResolvedValue(undefined);
  const { result } = renderHook(useAuth);
  await act(() => result.current.logout());
  expect(result.current.isAuthenticated).toBe(false);
});
