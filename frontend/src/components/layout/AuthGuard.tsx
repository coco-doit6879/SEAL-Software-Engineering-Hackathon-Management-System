"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCurrentUser, isAuthenticated } from "@/lib/auth";
import type { UserRole } from "@/types";

/** Maps each protected path prefix to its allowed roles. */
const ROUTE_ROLE_MAP: Record<string, UserRole[]> = {
  "/student": ["STUDENT"],
  "/judge": ["INTERNAL_JUDGE", "GUEST_JUDGE"],
  "/coordinator": ["COORDINATOR"],
};

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/auth/login");
      return;
    }

    const user = getCurrentUser();
    if (!user) {
      router.replace("/auth/login");
      return;
    }

    // Find if this path is protected by role
    const matchedPrefix = Object.keys(ROUTE_ROLE_MAP).find((prefix) =>
      pathname.startsWith(prefix)
    );

    if (matchedPrefix) {
      const allowedRoles = ROUTE_ROLE_MAP[matchedPrefix];
      if (!allowedRoles.includes(user.role)) {
        // Redirect to the role's own dashboard or home
        router.replace(getRoleDashboard(user.role));
        return;
      }
    }

    setChecking(false);
  }, [pathname, router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080b11]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm">Đang xác thực...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function getRoleDashboard(role: UserRole): string {
  switch (role) {
    case "STUDENT":
      return "/student";
    case "INTERNAL_JUDGE":
    case "GUEST_JUDGE":
      return "/judge";
    case "COORDINATOR":
      return "/coordinator";
    default:
      return "/";
  }
}
