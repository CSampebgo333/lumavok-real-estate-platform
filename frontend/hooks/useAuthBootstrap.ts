"use client";

import { isAxiosError } from "axios";
import { getErrorMessage } from "@/lib/errors";
import { useEffect } from "react";

import { authService } from "@/services";
import { useAuthStore } from "@/store/authStore";

/**
 * Restores the in-memory session from the HttpOnly refresh cookie on app load — the
 * access token itself is never persisted (docs/ARCHITECTURE.md §6), so every full
 * page load starts logged-out until this resolves. Called exactly once, from
 * app/providers.tsx; result lives in the store (`isBootstrapping`) so other
 * components (RequireAuth, Navbar) can read it without re-triggering the fetch.
 */
export function useAuthBootstrap() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const setBootstrapError = useAuthStore((state) => state.setBootstrapError);
  const setBootstrapped = useAuthStore((state) => state.setBootstrapped);

  useEffect(() => {
    let cancelled = false;
    const revision = useAuthStore.getState().sessionRevision;

    authService
      .refresh()
      .then((session) => {
        if (cancelled) return;
        const state = useAuthStore.getState();
        if (
          state.sessionRevision === revision ||
          (state.user?.id === session.user.id &&
            state.accessToken === session.accessToken)
        )
          setAuth(session.user, session.accessToken);
      })
      .catch((error: unknown) => {
        if (cancelled || useAuthStore.getState().sessionRevision !== revision)
          return;
        // An absent/ended session is normal for anonymous visitors; a provider
        // outage keeps the protected view blocked with a retryable explanation.
        if (
          isAxiosError(error) &&
          [400, 401].includes(error.response?.status ?? 0)
        )
          setBootstrapError(null);
        else setBootstrapError(getErrorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setBootstrapped();
      });

    return () => {
      cancelled = true;
    };
  }, [setAuth, setBootstrapped, setBootstrapError]);
}
