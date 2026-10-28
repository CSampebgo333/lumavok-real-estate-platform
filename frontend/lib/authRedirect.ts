import { ROUTES } from "@/constants/routes";
import type { User } from "@/types";

/** Route to the workspace supported by the freshly verified account. */
export function getPostLoginDestination(user: User): string {
  return user.role === "ADMIN"
    ? ROUTES.ADMIN
    : user.role === "DEVELOPER"
      ? user.developerId
        ? ROUTES.DASHBOARD
        : "/sell"
      : ROUTES.HOME;
}

/**
 * Guards against unvalidated open redirects (OWASP): proxy.ts's `?redirect=` param is
 * attacker-controllable (anyone can craft `/login?redirect=https://evil.example`), so it
 * must never be used verbatim. Only a same-origin relative path is honored.
 */
export function getSafeRedirectPath(
  path: string | undefined | null,
): string | undefined {
  if (
    !path ||
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.startsWith("/\\")
  ) {
    return undefined;
  }

  return path;
}
