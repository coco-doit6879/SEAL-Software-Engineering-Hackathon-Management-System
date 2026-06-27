"use client";

import { useState, useEffect } from "react";
import { getCurrentUser } from "@/lib/auth";
import type { AuthUser } from "@/types";

/**
 * Returns the current authenticated user from localStorage.
 * Re-reads on mount (client-side only).
 */
export function useCurrentUser(): AuthUser | null {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  return user;
}
