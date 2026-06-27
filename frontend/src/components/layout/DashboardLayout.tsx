"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Trophy,
  Users,
  Star,
  FileText,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { clearAuth, getCurrentUser } from "@/lib/auth";
import type { UserRole } from "@/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/coordinator",
    label: "Dashboard",
    icon: <LayoutDashboard size={18} />,
    roles: ["COORDINATOR"],
  },
  {
    href: "/coordinator/hackathons",
    label: "Hackathons",
    icon: <Trophy size={18} />,
    roles: ["COORDINATOR"],
  },
  {
    href: "/coordinator/teams",
    label: "Đội thi",
    icon: <Users size={18} />,
    roles: ["COORDINATOR"],
  },
  {
    href: "/coordinator/judges",
    label: "Giám khảo",
    icon: <Star size={18} />,
    roles: ["COORDINATOR"],
  },
  {
    href: "/student",
    label: "Dashboard",
    icon: <LayoutDashboard size={18} />,
    roles: ["STUDENT"],
  },
  {
    href: "/student/team",
    label: "Đội của tôi",
    icon: <Users size={18} />,
    roles: ["STUDENT"],
  },
  {
    href: "/student/submissions",
    label: "Nộp bài",
    icon: <FileText size={18} />,
    roles: ["STUDENT"],
  },
  {
    href: "/judge",
    label: "Dashboard",
    icon: <LayoutDashboard size={18} />,
    roles: ["INTERNAL_JUDGE", "GUEST_JUDGE"],
  },
  {
    href: "/judge/evaluate",
    label: "Chấm điểm",
    icon: <Star size={18} />,
    roles: ["INTERNAL_JUDGE", "GUEST_JUDGE"],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = getCurrentUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredNav = NAV_ITEMS.filter(
    (item) => user && item.roles.includes(user.role)
  );

  function handleLogout() {
    clearAuth();
    router.push("/auth/login");
  }

  const roleLabel: Record<UserRole, string> = {
    STUDENT: "Sinh viên",
    MENTOR: "Mentor",
    COORDINATOR: "Ban tổ chức",
    INTERNAL_JUDGE: "Giám khảo nội bộ",
    GUEST_JUDGE: "Giám khảo khách",
  };

  return (
    <div className="flex min-h-screen bg-[#080b11]">
      {/* ── Overlay (mobile) ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-64 flex flex-col
          bg-[#0d111b]/90 border-r border-white/5
          backdrop-blur-xl transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:relative lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Trophy size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">SEAL</p>
            <p className="text-slate-500 text-xs">Hackathon HMS</p>
          </div>
          <button
            className="ml-auto lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* User pill */}
        {user && (
          <div className="mx-3 mt-4 p-3 rounded-xl bg-white/5 border border-white/5">
            <p className="text-white text-sm font-semibold truncate">
              {user.fullName}
            </p>
            <p className="text-xs text-orange-400 mt-0.5">
              {roleLabel[user.role]}
            </p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 mt-4 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-150 group
                  ${
                    active
                      ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }
                `}
              >
                <span className={active ? "text-orange-400" : "text-slate-500 group-hover:text-slate-300"}>
                  {item.icon}
                </span>
                {item.label}
                {active && (
                  <ChevronRight size={14} className="ml-auto text-orange-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Notifications + Logout */}
        <div className="px-3 pb-5 space-y-1 border-t border-white/5 pt-3">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            <Bell size={18} />
            Thông báo
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-all"
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex items-center gap-3 px-5 py-3.5 bg-[#080b11]/80 border-b border-white/5 backdrop-blur-xl">
          <button
            className="lg:hidden text-slate-400 hover:text-white transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-xs font-bold">
            {user?.fullName?.charAt(0) ?? "?"}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
