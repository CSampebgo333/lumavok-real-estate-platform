import type { AuthSession } from "@/services/auth.service";
import type { UserRole } from "@/types";
export function mapSession(raw: AuthSession): AuthSession {
  const role = raw.user.role as string;
  return {
    ...raw,
    user: {
      ...raw.user,
      fullName: raw.user.fullName?.trim() || raw.user.email,
      role: (role === "PROPERTY_DEVELOPER" ? "DEVELOPER" : role) as UserRole,
    },
  };
}
