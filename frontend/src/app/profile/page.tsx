"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  GraduationCap,
  Shield,
  CreditCard,
  Building,
  KeyRound,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/api";

// ─── Toast Types ─────────────────────────────────────────────────────────────
type ToastType = "success" | "error" | "warning" | "info";
interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

let _toastId = 0;

const TOAST_STYLES: Record<ToastType, string> = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  error: "border-red-500/30 bg-red-500/10 text-red-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  info: "border-blue-500/30 bg-blue-500/10 text-blue-300",
};
const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 flex-shrink-0" />,
  error: <XCircle className="w-4 h-4 flex-shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 flex-shrink-0" />,
  info: <Info className="w-4 h-4 flex-shrink-0" />,
};

// ─── Helper: Password Strength ────────────────────────────────────────────────
function getPasswordStrength(pwd: string) {
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

// ─── Role Dashboard Mapper ───────────────────────────────────────────────────
function getDashboardUrl(role: string): string {
  if (role === "COORDINATOR") return "/coordinator";
  if (role === "STUDENT") return "/student";
  if (role === "INTERNAL_JUDGE" || role === "GUEST_JUDGE") return "/judge";
  if (role === "MENTOR") return "/mentor";
  return "/";
}

export default function ProfilePage() {
  const router = useRouter();

  // Core state
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Inputs
  const [fullName, setFullName] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [university, setUniversity] = useState("");

  // Passwords
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = getPasswordStrength(password);

  // Toast helper
  function addToast(type: ToastType, message: string) {
    const id = ++_toastId;
    setToasts((p) => [...p, { id, type, message }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 5000);
  }

  useEffect(() => {
    const token = localStorage.getItem("seal_hms_token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    // Fetch fresh user data
    fetchWithAuth("/auth/me")
      .then((res: any) => {
        const u = res.data?.user ?? res.user ?? res;
        setUserData(u);
        setFullName(u.fullName || "");
        if (u.studentProfile) {
          setStudentCode(u.studentProfile.studentCode || "");
          setUniversity(u.studentProfile.university || "");
        }
      })
      .catch((err) => {
        addToast("error", "Lỗi tải thông tin cá nhân. Vui lòng đăng nhập lại.");
        router.push("/auth/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      addToast("warning", "Họ và tên không được bỏ trống.");
      return;
    }

    // Password validation if they try to edit it
    if (password) {
      if (password.length < 8) {
        addToast("warning", "Mật khẩu mới phải có ít nhất 8 ký tự.");
        return;
      }
      if (password !== confirmPassword) {
        addToast("warning", "Mật khẩu xác nhận không khớp.");
        return;
      }
    }

    setSaving(true);
    try {
      const payload: any = {
        fullName: fullName.trim(),
      };
      if (password) {
        payload.password = password;
      }
      if (userData.role === "STUDENT") {
        payload.studentCode = studentCode.trim();
        payload.university = university.trim();
      }

      const res: any = await fetchWithAuth("/auth/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      const updatedUser = res.data?.user ?? res.user ?? res;
      setUserData(updatedUser);
      localStorage.setItem("seal_hms_user", JSON.stringify(updatedUser));
      
      // Reset password fields
      setPassword("");
      setConfirmPassword("");
      
      addToast("success", "Cập nhật hồ sơ cá nhân thành công!");
    } catch (err: any) {
      addToast("error", err?.message || "Cập nhật hồ sơ thất bại.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !userData) {
    return (
      <div className="min-h-screen bg-[#080b11] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
          <p className="text-slate-400 text-sm">Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  const dashboardUrl = getDashboardUrl(userData.role);

  return (
    <div className="relative min-h-screen bg-[#080b11] text-slate-100 px-4 py-10 overflow-hidden">
      {/* Background Glowing Orbs */}
      <div className="absolute top-[-10%] right-[10%] w-[500px] h-[500px] rounded-full bg-orange-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[5%] w-[450px] h-[450px] rounded-full bg-indigo-700/8 blur-[120px] pointer-events-none" />

      {/* ── Toast Stack ── */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm shadow-xl ${TOAST_STYLES[t.type]}`}
            style={{ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
          >
            {TOAST_ICONS[t.type]}
            <span className="flex-1 leading-snug">{t.message}</span>
            <button
              onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))}
              className="opacity-60 hover:opacity-100 transition-opacity mt-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="relative z-10 max-w-2xl mx-auto space-y-6">
        {/* Back Link */}
        <button
          onClick={() => router.push(dashboardUrl)}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-orange-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại Bảng điều khiển
        </button>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Hồ sơ cá nhân
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Quản lý thông tin tài khoản và cập nhật bảo mật tài khoản của bạn.
          </p>
        </div>

        {/* Main Card */}
        <div
          className="rounded-2xl p-6 sm:p-8 border border-white/[0.06] space-y-6"
          style={{
            background: "rgba(15, 23, 42, 0.55)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            boxShadow:
              "0 10px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <form onSubmit={handleSaveProfile} className="space-y-6">
            
            {/* Account Details Row (Read-Only) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-white/[0.05]">
              {/* Email */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Email Đăng Nhập
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input
                    type="text"
                    disabled
                    value={userData.email}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-slate-500 bg-slate-900/40 border border-slate-800/60 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Vai trò */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Vai Trò Hệ Thống
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input
                    type="text"
                    disabled
                    value={userData.role}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-slate-500 bg-slate-900/40 border border-slate-800/60 cursor-not-allowed font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Editable profile fields */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider">
                Thông tin cơ bản
              </h3>

              {/* Họ và Tên */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Họ và Tên <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nhập họ và tên..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-600 bg-slate-900 border border-slate-800 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Student specific fields */}
              {userData.role === "STUDENT" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Mã sinh viên */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Mã số Sinh viên (MSSV)
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={studentCode}
                        onChange={(e) => setStudentCode(e.target.value)}
                        placeholder="Mã số sinh viên (SE170001)..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-600 bg-slate-900 border border-slate-800 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Trường đại học */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Trường Đại Học
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                        placeholder="Tên trường học của bạn..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-600 bg-slate-900 border border-slate-800 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Password edit fields */}
            <div className="space-y-4 pt-4 border-t border-white/[0.05]">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider">
                  Đổi mật khẩu bảo mật (Không bắt buộc)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Mật khẩu mới */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Tối thiểu 8 ký tự..."
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm text-white placeholder-slate-600 bg-slate-900 border border-slate-800 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Strength Bar */}
                  {password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              i <= strength.score ? strength.color : "bg-slate-800"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Độ mạnh:{" "}
                        <span className={`font-semibold ${strength.score === 4 ? "text-emerald-400" : "text-yellow-500"}`}>
                          {strength.label}
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Xác nhận mật khẩu mới */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới..."
                      className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-sm text-white placeholder-slate-600 bg-slate-900 border transition-all
                        focus:outline-none focus:ring-1
                        ${
                          confirmPassword && password !== confirmPassword
                            ? "border-red-500/40 focus:border-red-500/50 focus:ring-red-500/10"
                            : confirmPassword && password === confirmPassword
                            ? "border-emerald-500/40 focus:border-emerald-500/50 focus:ring-emerald-500/10"
                            : "border-slate-800 focus:border-orange-500/50 focus:ring-orange-500/20"
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-lg shadow-orange-500/10 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {saving ? "Đang lưu thay đổi..." : "Lưu Thông Tin & Mật Khẩu"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
