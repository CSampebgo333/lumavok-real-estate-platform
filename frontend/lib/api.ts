import { getStoredLanguage } from "@/lib/locale";
import { refreshSession } from "@/lib/refreshSession";
import axios, { AxiosError } from "axios";

import { API_BASE_URL } from "@/constants/config";
import { useAuthStore } from "@/store/authStore";

/** Configured Axios instance for all backend API calls. */
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  config.params = { lang: getStoredLanguage(), ...config.params };
  const state = useAuthStore.getState();
  if (config._requestUserId === undefined)
    config._requestUserId = state.user?.id ?? null;
  const accessToken = state.accessToken;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

declare module "axios" {
  export interface InternalAxiosRequestConfig {
    _retried?: boolean;
    _requestUserId?: string | null;
  }
}

// Silent-refresh-and-retry: an access token expires (15min) well before the refresh
// cookie (7 days) — see docs/ARCHITECTURE.md §6. A request that 401s because the token
// expired mid-session gets one retry after a fresh token, instead of surfacing a
// spurious error or forcing the user to manually reload.
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retried ||
      (originalRequest.url?.startsWith("/auth/") &&
        originalRequest.url !== "/auth/logout")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retried = true;

    try {
      const { accessToken } = await refreshSession();
      if (
        (useAuthStore.getState().user?.id ?? null) !==
        originalRequest._requestUserId
      )
        throw new Error("Session changed. Please try again.");
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      if (
        axios.isAxiosError(refreshError) &&
        [400, 401].includes(refreshError.response?.status ?? 0) &&
        (useAuthStore.getState().user?.id ?? null) ===
          originalRequest._requestUserId
      )
        useAuthStore.getState().clearAuth();
      return Promise.reject(refreshError);
    }
  },
);
