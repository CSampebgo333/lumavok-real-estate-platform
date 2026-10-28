import { create } from "zustand";

import type { User } from "@/types";

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  /** True until the one-time session-restore call (useAuthBootstrap) resolves. */
  isBootstrapping: boolean;
  sessionRevision: number;
  bootstrapError: string | null;
  setBootstrapError: (error: string | null) => void;
  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
  setBootstrapped: () => void;
}

/** Access token lives in memory only — never persisted, per the token strategy in docs/ARCHITECTURE.md. */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isBootstrapping: true,
  sessionRevision: 0,
  bootstrapError: null,
  setBootstrapError: (bootstrapError) => set({ bootstrapError }),
  setAuth: (user, accessToken) =>
    set((previous) => ({
      user,
      accessToken,
      isAuthenticated: true,
      bootstrapError: null,
      sessionRevision:
        previous.sessionRevision +
        (previous.user?.id !== user.id ||
        previous.user?.role !== user.role ||
        previous.user?.developerId !== user.developerId ||
        previous.accessToken !== accessToken
          ? 1
          : 0),
    })),
  clearAuth: () =>
    set((previous) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      bootstrapError: null,
      sessionRevision: previous.sessionRevision + 1,
    })),
  setBootstrapped: () => set({ isBootstrapping: false }),
}));
