import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithQueryClient } from "@/test/renderWithQueryClient";
import { MOCK_PROPERTIES } from "@/services/mocks/properties.mock";

import { SavedPropertiesView } from "./SavedPropertiesView";

import { useAuthStore } from "@/store/authStore";
let saved: string[] = [];
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/services/favorite.service", () => ({
  favoriteService: {
    getState: async () => ({ ids: [...saved], countDeltas: {} }),
    toggleFavorite: async (id: string) => {
      saved = saved.includes(id)
        ? saved.filter((x) => x !== id)
        : [...saved, id];
      return { ids: [...saved], countDeltas: {} };
    },
  },
}));
vi.mock("@/services/property.service", async () => {
  const { MOCK_PROPERTIES } = await import("@/services/mocks/properties.mock");
  return {
    propertyService: {
      getPropertiesByIds: async (ids: string[]) =>
        MOCK_PROPERTIES.filter((p) => ids.includes(p.id)),
    },
  };
});

function seedSaved(ids: string[]) {
  saved = ids;
}

describe("SavedPropertiesView", () => {
  beforeEach(() => {
    saved = [];
    useAuthStore.getState().setAuth(
      {
        id: "buyer",
        email: "buyer@example.test",
        fullName: "Buyer",
        role: "USER",
      },
      "test",
    );
  });

  it("shows an empty state with a route back to browsing when nothing is saved", async () => {
    renderWithQueryClient(<SavedPropertiesView />);

    await waitFor(() =>
      expect(screen.getByText("Nothing saved yet")).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("link", { name: /Browse properties/ }),
    ).toHaveAttribute("href", "/properties");
  });

  it("resolves saved ids into real property cards", async () => {
    const [first, second] = MOCK_PROPERTIES;
    seedSaved([first.id, second.id]);

    renderWithQueryClient(<SavedPropertiesView />);

    await waitFor(() =>
      expect(screen.getByText(first.title)).toBeInTheDocument(),
    );
    expect(screen.getByText(second.title)).toBeInTheDocument();
  });

  it("states plainly that saves are account-synced", async () => {
    seedSaved([MOCK_PROPERTIES[0].id]);

    renderWithQueryClient(<SavedPropertiesView />);

    await waitFor(() =>
      expect(screen.getByText(/synced to your account/i)).toBeInTheDocument(),
    );
  });

  it("does not show the browser-storage caveat when there is nothing saved", async () => {
    renderWithQueryClient(<SavedPropertiesView />);

    await waitFor(() =>
      expect(screen.getByText("Nothing saved yet")).toBeInTheDocument(),
    );
    expect(
      screen.queryByText(/synced to your account/i),
    ).not.toBeInTheDocument();
  });

  it("removes a property from the list through the same FavoriteButton that added it", async () => {
    const user = userEvent.setup();
    const [first] = MOCK_PROPERTIES;
    seedSaved([first.id]);

    renderWithQueryClient(<SavedPropertiesView />);

    await waitFor(() =>
      expect(screen.getByText(first.title)).toBeInTheDocument(),
    );

    await user.click(
      screen.getByRole("button", {
        name: `Remove ${first.title} from saved properties`,
      }),
    );

    await waitFor(() =>
      expect(screen.queryByText(first.title)).not.toBeInTheDocument(),
    );
    expect(saved).toEqual([]);
  });

  it("drops a saved id whose property is no longer listed, without erroring", async () => {
    seedSaved([MOCK_PROPERTIES[0].id, "delisted-property"]);

    renderWithQueryClient(<SavedPropertiesView />);

    await waitFor(() =>
      expect(screen.getByText(MOCK_PROPERTIES[0].title)).toBeInTheDocument(),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
