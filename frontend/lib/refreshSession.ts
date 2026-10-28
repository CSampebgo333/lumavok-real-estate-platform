import axios from "axios";
import { API_BASE_URL } from "@/constants/config";
import { mapSession } from "@/lib/authSession";
import { useAuthStore } from "@/store/authStore";
import type { ApiResponse } from "@/types";
import type { AuthSession } from "@/services/auth.service";
let pending: Promise<AuthSession> | null = null;
/** One refresh request across bootstrap and expired requests. A later login or
 * logout invalidates an older response before it can change client identity. */
export function refreshSession(): Promise<AuthSession> {
  if (pending) return pending;
  const revision = useAuthStore.getState().sessionRevision;
  pending = axios
    .post<ApiResponse<AuthSession>>(
      `${API_BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true },
    )
    .then((response) => {
      if (useAuthStore.getState().sessionRevision !== revision)
        throw new Error("Session changed. Please try again.");
      const session = mapSession(response.data.data);
      useAuthStore.getState().setAuth(session.user, session.accessToken);
      return session;
    })
    .finally(() => {
      pending = null;
    });
  return pending;
}
