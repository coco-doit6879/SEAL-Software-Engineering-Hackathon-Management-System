"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  GraduationCap,
  CreditCard,
  UserCog,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/api";

// ─── Types ──────────────────────────────────────────────────────────────────
type RegisterRole = "STUDENT" | "MENTOR";

interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role: RegisterRole;
  isFptStudent: boolean;
  studentCode?: string;
}

// ─── Helper: Password strength ───────────────────────────────────────────────
function getPasswordStrength(pwd: string): {
  score: number;
  label: string;
  color: string;
} {
  if (!pwd) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const map = [
    { score: 1, label: "Yếu", color: "bg-red-500" },
    { score: 2, label: "Trung bình", color: "bg-yellow-500" },
    { score: 3, label: "Khá", color: "bg-blue-500" },
    { score: 4, label: "Mạnh", color: "bg-emerald-500" },
  ];
  return (
    map.find((m) => m.score === score) || { score, label: "Yếu", color: "bg-red-500" }
  );
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    role: "STUDENT" as RegisterRole,
    isFptStudent: false,
    studentId: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const strength = getPasswordStrength(form.password);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
  }

  function validate(): string | null {
    if (!form.name.trim()) return "Vui lòng nhập họ và tên.";
    if (!form.email.trim()) return "Vui lòng nhập email.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return "Email không hợp lệ.";
    if (!form.password) return "Vui lòng nhập mật khẩu.";
    if (form.password.length < 8)
      return "Mật khẩu phải có ít nhất 8 ký tự.";
    if (form.password !== form.confirmPassword)
      return "Xác nhận mật khẩu không khớp.";
    if (!form.phone.trim()) return "Vui lòng nhập số điện thoại.";
    if (form.isFptStudent && !form.studentId.trim())
      return "Sinh viên FPT phải nhập Mã số sinh viên (MSSV).";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    const payload: RegisterPayload = {
      fullName: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      isFptStudent: form.isFptStudent,
      ...(form.isFptStudent ? { studentCode: form.studentId } : {}),
    };

    try {
      await fetchWithAuth("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setSuccessMsg(
        "Đăng ký thành công! Đang chuyển hướng về trang đăng nhập..."
      );
      setTimeout(() => router.push("/auth/login"), 2200);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Đăng ký thất bại. Thử lại."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#080b11] px-4 py-10">
      {/* ── Ambient glowing orbs ── */}
      <div className="absolute top-[-5%] right-[15%] w-[500px] h-[500px] rounded-full bg-orange-600/15 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[5%] left-[10%] w-[380px] h-[380px] rounded-full bg-indigo-700/12 blur-[110px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg">
        {/* ── Header ── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 shadow-lg shadow-orange-500/30 mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Tạo tài khoản mới
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Tham gia{" "}
            <span className="text-orange-400 font-semibold">SEAL Hackathon 2026</span>{" "}
            ngay hôm nay
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
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm mb-5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── Success Toast ── */}
          {successMsg && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm mb-5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ── Họ và tên ── */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Họ và tên <span className="text-orange-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="reg-name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-500
                    bg-slate-800/60 border border-slate-700/60
                    focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30
                    transition-all duration-200"
                />
              </div>
            </div>

            {/* ── Email ── */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Email <span className="text-orange-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="you@email.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-500
                    bg-slate-800/60 border border-slate-700/60
                    focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30
                    transition-all duration-200"
                />
              </div>
            </div>

            {/* ── Số điện thoại ── */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Số điện thoại <span className="text-orange-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="reg-phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="0901 234 567"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-500
                    bg-slate-800/60 border border-slate-700/60
                    focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30
                    transition-all duration-200"
                />
              </div>
            </div>

            {/* ── Mật khẩu ── */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Mật khẩu <span className="text-orange-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="Tối thiểu 8 ký tự"
                  className="w-full pl-10 pr-12 py-3 rounded-xl text-sm text-white placeholder-slate-500
                    bg-slate-800/60 border border-slate-700/60
                    focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30
                    transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label="Toggle password"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Password strength bar */}
              {form.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i <= strength.score ? strength.color : "bg-slate-700"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    Độ mạnh:{" "}
                    <span
                      className={`font-medium ${
                        strength.score === 4
                          ? "text-emerald-400"
                          : strength.score === 3
                          ? "text-blue-400"
                          : strength.score === 2
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`}
                    >
                      {strength.label}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* ── Xác nhận mật khẩu ── */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Xác nhận mật khẩu <span className="text-orange-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="reg-confirm-password"
                  type={showConfirm ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => update("confirmPassword", e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  className={`w-full pl-10 pr-12 py-3 rounded-xl text-sm text-white placeholder-slate-500
                    bg-slate-800/60 border transition-all duration-200
                    focus:outline-none focus:ring-1
                    ${
                      form.confirmPassword && form.password !== form.confirmPassword
                        ? "border-red-500/60 focus:border-red-500/60 focus:ring-red-500/30"
                        : form.confirmPassword && form.password === form.confirmPassword
                        ? "border-emerald-500/60 focus:border-emerald-500/60 focus:ring-emerald-500/30"
                        : "border-slate-700/60 focus:border-orange-500/60 focus:ring-orange-500/30"
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label="Toggle confirm password"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {form.confirmPassword && form.password === form.confirmPassword && (
                  <CheckCircle2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                )}
              </div>
            </div>

            {/* ── Chọn vai trò ── */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Vai trò đăng ký <span className="text-orange-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(["STUDENT", "MENTOR"] as RegisterRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    id={`role-${r.toLowerCase()}`}
                    onClick={() => update("role", r)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium
                      transition-all duration-200
                      ${
                        form.role === r
                          ? "border-orange-500/60 bg-orange-500/10 text-orange-400"
                          : "border-slate-700/60 bg-slate-800/40 text-slate-400 hover:border-slate-600"
                      }`}
                  >
                    {r === "STUDENT" ? (
                      <GraduationCap className="w-4 h-4" />
                    ) : (
                      <UserCog className="w-4 h-4" />
                    )}
                    {r === "STUDENT" ? "Thí sinh" : "Mentor"}
                  </button>
                ))}
              </div>
            </div>

            {/* ── FPT Student Checkbox ── */}
            <div
              className={`rounded-xl border p-4 transition-all duration-300 ${
                form.isFptStudent
                  ? "border-orange-500/30 bg-orange-500/5"
                  : "border-slate-700/50 bg-slate-800/20"
              }`}
            >
              <button
                type="button"
                id="fpt-student-checkbox"
                onClick={() => update("isFptStudent", !form.isFptStudent)}
                className="flex items-center gap-3 w-full"
              >
                {/* Custom checkbox */}
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center border flex-shrink-0 transition-all duration-200 ${
                    form.isFptStudent
                      ? "bg-orange-500 border-orange-500"
                      : "bg-slate-700 border-slate-600"
                  }`}
                >
                  {form.isFptStudent && (
                    <svg
                      className="w-3 h-3 text-white"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-200 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-orange-400" />
                    Tôi là sinh viên FPT University
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tích chọn nếu bạn đang học tại FPT University
                  </p>
                </div>
              </button>

              {/* ── MSSV Field (conditional) ── */}
              {form.isFptStudent && (
                <div className="mt-4 border-t border-orange-500/20 pt-4">
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Mã số sinh viên (MSSV){" "}
                    <span className="text-orange-500">*</span>
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      id="reg-student-id"
                      type="text"
                      value={form.studentId}
                      onChange={(e) => update("studentId", e.target.value)}
                      placeholder="SE170001"
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-500
                        bg-slate-800/60 border border-orange-500/30
                        focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30
                        transition-all duration-200"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">
                    MSSV sẽ được xác minh trong quá trình duyệt đội thi.
                  </p>
                </div>
              )}
            </div>

            {/* ── Submit ── */}
            <button
              type="submit"
              id="register-submit"
              disabled={loading || !!successMsg}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-semibold text-white mt-2
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
              ) : successMsg ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <UserCog className="w-5 h-5" />
              )}
              {loading
                ? "Đang đăng ký..."
                : successMsg
                ? "Đăng ký thành công!"
                : "Tạo tài khoản"}
            </button>
          </form>

          {/* ── Login Link ── */}
          <p className="text-center text-sm text-slate-500 mt-6">
            Đã có tài khoản?{" "}
            <Link
              href="/auth/login"
              className="text-orange-400 hover:text-orange-300 font-medium inline-flex items-center gap-0.5 transition-colors"
            >
              Đăng nhập ngay
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
