"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useUi } from "@/components/common/UiText";
import { ErrorState } from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/common/Loading";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/store/authStore";
import type { User, UserRole } from "@/types";

interface RequireAuthProps {
  children: React.ReactNode;
  /** Workspace role. Seller routes require an active seller identity. */
  role?: UserRole;
}

function hasRequiredRole(user: User | null, requiredRole: UserRole) {
  if (!user) return false;
  if (requiredRole === "USER") return true;
  return (
    user.role === requiredRole &&
    (requiredRole !== "DEVELOPER" || !!user.developerId)
  );
}

/**
 * Client-side defense-in-depth for (dashboard)/(admin) layouts. proxy.ts already gates on
 * the refresh cookie's presence server-side (redirecting straight to /login); this catches
 * what proxy.ts can't see — bootstrap resolving to "not authenticated" (cookie invalid or
 * expired) or an authenticated user whose role doesn't satisfy the route — and shows an
 * explicit page instead of either a redirect loop or silently rendering protected content.
 *
 * Reads isBootstrapping from the store rather than calling useAuthBootstrap() again —
 * that hook already runs exactly once, in app/providers.tsx; calling it a second time here
 * would fire a second, redundant session-restore request.
 */
export function RequireAuth({ children, role }: RequireAuthProps) {
  const ui = useUi();
  const bootstrapError = useAuthStore((state) => state.bootstrapError);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);

  const isForbidden = isAuthenticated && !!role && !hasRequiredRole(user, role);

  useEffect(() => {
    if (isBootstrapping || bootstrapError) return;

    if (!isAuthenticated) {
      router.replace(ROUTES.UNAUTHORIZED);
    } else if (isForbidden) {
      router.replace(ROUTES.FORBIDDEN);
    }
  }, [isBootstrapping, isAuthenticated, isForbidden, router, bootstrapError]);

  if (!isBootstrapping && bootstrapError)
    return (
      <ErrorState
        title={ui("Your session could not be verified.")}
        description={bootstrapError}
        action={
          <Button onClick={() => window.location.reload()}>
            {ui("Try again")}
          </Button>
        }
      />
    );
  if (isBootstrapping || !isAuthenticated || isForbidden) {
    return <Loading />;
  }

  return children;
}
