"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  LogIn,
  Zap,
  Shield,
  ChevronRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/api";

// ─── Types ──────────────────────────────────────────────────────────────────
type UserRole =
  | "COORDINATOR"
  | "INTERNAL_JUDGE"
  | "GUEST_JUDGE"
  | "STUDENT"
  | "MENTOR";

interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

// ─── Demo Accounts ──────────────────────────────────────────────────────────
const DEMO_ACCOUNTS = [
  {
    label: "Ban tổ chức",
    email: "coordinator@fpt.edu.vn",
    password: "Password123!",
    color: "from-orange-500 to-amber-500",
    icon: "🎯",
    role: "COORDINATOR",
  },
  {
    label: "Giám khảo",
    email: "faculty.judge@fpt.edu.vn",
    password: "Password123!",
    color: "from-blue-500 to-indigo-500",
    icon: "⚖️",
    role: "JUDGE",
  },
  {
    label: "Thí sinh",
    email: "student1@fpt.edu.vn",
    password: "Password123!",
    color: "from-emerald-500 to-teal-500",
    icon: "🧑‍💻",
    role: "STUDENT",
  },
];

// ─── Helper ──────────────────────────────────────────────────────────────────
function getRoleRedirect(role: UserRole): string {
  if (role === "COORDINATOR") return "/coordinator";
  if (role === "INTERNAL_JUDGE" || role === "GUEST_JUDGE") return "/judge";
  return "/student";
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Auto-fill remembered email
    const saved = localStorage.getItem("seal_hms_remember");
    if (saved) setEmail(saved);
  }, []);

  async function handleSubmit(
    e: React.FormEvent,
    overrideEmail?: string,
    overridePassword?: string
  ) {
    e?.preventDefault();
    setError("");
    const loginEmail = overrideEmail ?? email;
    const loginPassword = overridePassword ?? password;

    if (!loginEmail || !loginPassword) {
      setError("Vui lòng điền đầy đủ thông tin đăng nhập.");
      return;
    }

    setLoading(true);
    try {
      const data: any = await fetchWithAuth("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      localStorage.setItem("seal_hms_token", data.data.token);
      localStorage.setItem("seal_hms_user", JSON.stringify(data.data.user));
      
      if (remember && !overrideEmail) {
        localStorage.setItem("seal_hms_remember", loginEmail);
      } else if (!remember) {
        localStorage.removeItem("seal_hms_remember");
      }

      router.push(getRoleRedirect(data.data.user.role));
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Đăng nhập thất bại. Thử lại."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin(acc: (typeof DEMO_ACCOUNTS)[0]) {
    setError("");
    setDemoLoading(acc.role);
    setEmail(acc.email);
    setPassword(acc.password);
    try {
      const data: any = await fetchWithAuth("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: acc.email, password: acc.password }),
      });
      localStorage.setItem("seal_hms_token", data.data.token);
      localStorage.setItem("seal_hms_user", JSON.stringify(data.data.user));
      router.push(getRoleRedirect(data.data.user.role));
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Đăng nhập nhanh thất bại."
      );
    } finally {
      setDemoLoading(null);
    }
  }

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#080b11] px-4 py-12">
      {/* ── Ambient glowing orbs ── */}
      <div className="absolute top-[-10%] left-[20%] w-[480px] h-[480px] rounded-full bg-orange-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[15%] w-[400px] h-[400px] rounded-full bg-blue-700/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[5%] w-[200px] h-[200px] rounded-full bg-amber-500/10 blur-[80px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* ── Logo & Header ── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 shadow-lg shadow-orange-500/30 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Chào mừng trở lại
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Đăng nhập vào{" "}
            <span className="text-orange-400 font-semibold">SEAL-HMS</span> để
            tiếp tục
          </p>
        </div>

        {/* ── Glass Card ── */}
        <div
          className="rounded-2xl p-8 border border-white/[0.07]"
          style={{
            background: "rgba(15, 23, 42, 0.55)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            boxShadow:
              "0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {/* ── Error Banner ── */}
          {error && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm mb-6 animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@fpt.edu.vn"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-500
                    bg-slate-800/60 border border-slate-700/60
                    focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30
                    transition-all duration-200"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-300">
                  Mật khẩu
                </label>
                <button
                  type="button"
                  className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full pl-10 pr-12 py-3 rounded-xl text-sm text-white placeholder-slate-500
                    bg-slate-800/60 border border-slate-700/60
                    focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30
                    transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                id="remember-me"
                onClick={() => setRemember((v) => !v)}
                className={`relative w-10 h-5.5 rounded-full transition-all duration-300 flex-shrink-0 ${
                  remember ? "bg-orange-500" : "bg-slate-700"
                }`}
                style={{ height: "22px" }}
                aria-checked={remember}
                role="switch"
              >
                <span
                  className={`absolute top-[3px] w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${
                    remember ? "left-[22px]" : "left-[3px]"
                  }`}
                />
              </button>
              <span className="text-sm text-slate-400">Nhớ tài khoản</span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="login-submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-semibold text-white
                bg-gradient-to-r from-orange-600 to-orange-500
                hover:from-orange-500 hover:to-amber-500
                shadow-lg shadow-orange-500/25
                hover:shadow-orange-500/40 hover:scale-[1.02]
                active:scale-[0.98]
                disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100
                transition-all duration-200"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <LogIn className="w-5 h-5" />
              )}
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          {/* ── Divider ── */}
          <div className="flex items-center gap-3 my-6">
            <div className="h-px flex-1 bg-slate-700/60" />
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-500" />
              Demo Quick Login
            </span>
            <div className="h-px flex-1 bg-slate-700/60" />
          </div>

          {/* ── Quick Demo Buttons ── */}
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.role}
                id={`demo-login-${acc.role.toLowerCase()}`}
                type="button"
                onClick={() => handleDemoLogin(acc)}
                disabled={demoLoading !== null}
                className={`relative flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl
                  border border-white/[0.07]
                  hover:border-white/15 hover:scale-[1.03]
                  active:scale-[0.97]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200 overflow-hidden group`}
                style={{
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                {/* Gradient shine on hover */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${acc.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl`}
                />
                {demoLoading === acc.role ? (
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                ) : (
                  <span className="text-lg">{acc.icon}</span>
                )}
                <span className="text-[10px] font-medium text-slate-400 text-center leading-tight">
                  {acc.label}
                </span>
              </button>
            ))}
          </div>

          {/* ── Register Link ── */}
          <p className="text-center text-sm text-slate-500 mt-6">
            Chưa có tài khoản?{" "}
            <Link
              href="/auth/register"
              className="text-orange-400 hover:text-orange-300 font-medium inline-flex items-center gap-0.5 transition-colors"
            >
              Đăng ký ngay
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </p>
        </div>

        {/* ── Footer tag ── */}
        <p className="text-center text-xs text-slate-600 mt-6">
          SEAL-HMS © 2026 · FPT University HCM · Software Engineering Faculty
        </p>
      </div>
    </div>
  );
}
