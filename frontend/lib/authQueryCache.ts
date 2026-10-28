import type { QueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
/** Discard private responses whenever the signed-in account changes. */
export function watchAuthQueryCache(client: QueryClient) {
 return useAuthStore.subscribe((next,previous)=>{
  if(next.user?.id!==previous.user?.id){void client.cancelQueries();client.clear();}
 });
}
