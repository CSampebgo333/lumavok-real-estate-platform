"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@/store/authStore";
import { favoriteService, type FavoritesState } from "@/services";

const FAVORITES_KEY = ["favorites"] as const;

/** Favorites are account-owned and refreshed on focus and after mutations. */
export function useFavoritesState() {
  const userId = useAuthStore(state => state.user?.id);
  return useQuery({
    queryKey: [...FAVORITES_KEY, userId],
    enabled: !!userId,
    queryFn: favoriteService.getState,
    staleTime: 30000,
  });
}

export function useIsFavorited(propertyId: string): boolean {
  const { data } = useFavoritesState();
  return data?.ids.includes(propertyId) ?? false;
}

/** `baselineCount` is the mock catalogue's own seeded `Property.favoriteCount` — see favorite.service.ts. */
export function useFavoriteCount(
  propertyId: string,
  baselineCount = 0,
): number {
  const { data } = useFavoritesState();
  return baselineCount + (data?.countDeltas[propertyId] ?? 0);
}

/** Optimistic favorite changes roll back on failure, then refresh server state. */
export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const userId = useAuthStore(state => state.user?.id);
  const key = [...FAVORITES_KEY, userId];

  return useMutation({
    mutationFn: (propertyId: string) =>
      favoriteService.toggleFavorite(propertyId),
    onMutate: async (propertyId: string) => {
      await queryClient.cancelQueries({ queryKey: FAVORITES_KEY });
      const previous = queryClient.getQueryData<FavoritesState>(key);

      const ids = new Set(previous?.ids ?? []);
      const willFavorite = !ids.has(propertyId);
      if (willFavorite) ids.add(propertyId);
      else ids.delete(propertyId);

      const countDeltas = { ...(previous?.countDeltas ?? {}) };
      countDeltas[propertyId] =
        (countDeltas[propertyId] ?? 0) + (willFavorite ? 1 : -1);

      queryClient.setQueryData<FavoritesState>(key, {
        ids: [...ids],
        countDeltas,
      });

      return { previous };
    },
    onError: (_error, _propertyId, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      else queryClient.removeQueries({ queryKey: key, exact: true });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: FAVORITES_KEY });
    },
  });
}
