import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { expect, it, vi } from "vitest";
import { SellerProfileView } from "./AccountViews";
import { useAuthStore } from "@/store/authStore";
const locations = vi.hoisted(() => ({
  data: [] as Array<{ id: string; name: string; districts: [] }>,
  isError: false,
}));
vi.mock("@/hooks/useLocations", () => ({ useLocations: () => locations }));
vi.mock("@/services/account.service", () => ({
  accountService: {
    getProfile: vi.fn().mockResolvedValue({
      id: "dev1",
      businessName: "Agence Faso",
      cityId: "c1",
      phoneNumber: "+22670000000",
      whatsappNumber: "+22670000000",
      publicEmail: null,
      bio: "Local profile",
      specialization: "",
      sellerStatus: "ACTIVE",
      updatedAt: "2026-10-28T00:00:00.000Z",
    }),
  },
}));
it("retains a profile's canonical city when location options arrive after the form", async () => {
  useAuthStore.getState().setAuth(
    {
      id: "u1",
      email: "seller@example.test",
      fullName: "Seller",
      role: "DEVELOPER",
      developerId: "dev1",
    },
    "fixture",
  );
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const view = () => (
    <QueryClientProvider client={client}>
      <SellerProfileView />
    </QueryClientProvider>
  );
  const { rerender, unmount } = render(view());
  await screen.findByDisplayValue("Agence Faso");
  locations.data = [{ id: "c1", name: "Ouagadougou", districts: [] }];
  rerender(view());
  expect(screen.getByLabelText("City", { exact: true })).toHaveValue("c1");
  unmount();
  client.clear();
});
