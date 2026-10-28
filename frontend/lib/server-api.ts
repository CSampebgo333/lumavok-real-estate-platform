import "server-only";
import { cookies } from "next/headers";
import type {
  Property,
  PropertyDetail,
  DeveloperProfile,
  PaginatedResult,
  ApiResponse,
} from "@/types";
import { rankSimilarProperties } from "@/lib/similarProperties";
export class CatalogueError extends Error {
  constructor(public readonly status: number) {
    super("Catalogue unavailable");
  }
}
async function read<T>(path: string): Promise<T> {
  const language =
    (await cookies()).get("lumavok-language")?.value === "en" ? "en" : "fr";
  const origin = process.env.BACKEND_API_URL ?? "http://localhost:4000";
  const url = new URL(origin + "/api/v1" + path);
  url.searchParams.set("lang", language);
  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new CatalogueError(response.status);
  return ((await response.json()) as ApiResponse<T>).data;
}
export const serverPropertyService = {
  getProperties: ({
    pageSize = 12,
    category,
    sort,
  }: { pageSize?: number; category?: string; sort?: string } = {}) => {
    const query = new URLSearchParams({ pageSize: String(pageSize) });
    if (category) query.set("category", category);
    if (sort) query.set("sort", sort);
    return read<PaginatedResult<Property>>("/properties?" + query);
  },
  getPropertyBySlug: (slug: string) =>
    read<PropertyDetail>("/properties/" + encodeURIComponent(slug)),
  getRelatedProperties: async (property: Property, limit = 4) =>
    rankSimilarProperties(
      property,
      await read<Property[]>(
        `/properties/${encodeURIComponent(property.id)}/related?limit=${limit}`,
      ),
      limit,
    ),
};
export const serverDeveloperService = {
  getDeveloperBySlug: (slug: string) =>
    read<DeveloperProfile>("/developers/" + encodeURIComponent(slug)),
  getDeveloperListings: (id: string) =>
    read<PaginatedResult<Property>>(
      `/developers/${encodeURIComponent(id)}/listings`,
    ),
};
