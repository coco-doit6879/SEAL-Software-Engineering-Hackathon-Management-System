import type { AuthUser } from "@/types";

const TOKEN_KEY = "seal_hms_token";
const USER_KEY = "seal_hms_user";

/** Persist token and user to localStorage after a successful login. */
export function saveAuth(token: string, user: AuthUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/** Retrieve the stored JWT token. Returns null on server-side render. */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

/** Retrieve the currently logged-in user object. Returns null if not found. */
export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

/** Remove all auth data from localStorage (logout). */
export function clearAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/** Returns true if a token is present in localStorage. */
export function isAuthenticated(): boolean {
  return !!getToken();
}
