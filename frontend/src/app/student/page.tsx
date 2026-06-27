"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Github,
  Globe,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  LogOut,
  Trophy,
  Users,
  Lock,
  RefreshCw,
  ChevronRight,
  Info,
  ShieldAlert,
  Hourglass,
  Star,
  BookOpen,
  Eye,
  X,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────
type TeamStatus = "PENDING" | "APPROVED" | "DISQUALIFIED";
type RoundStatus =
  | "SUBMISSION_OPEN"
  | "CALIBRATION"
  | "EVALUATION"
  | "COMPLETED";

interface UserMe {
  id: string;
  name: string;
  email: string;
  role: string;
  team?: {
    id: string;
    name: string;
    status: TeamStatus;
    disqualificationReason?: string;
    isLeader: boolean;
    members: { id: string; name: string; email: string; isLeader: boolean }[];
  };
}

interface Round {
  id: string;
  name: string;
  roundNumber: number;
  status: RoundStatus;
  submissionDeadline?: string;
  eventName?: string;
  mySubmission?: {
    id: string;
    repoUrl: string;
    demoUrl: string;
    submittedAt: string;
    status: string;
  };
}

// ─── Toast ───────────────────────────────────────────────────────────────────
type ToastType = "success" | "error" | "warning" | "info";
interface ToastData {
  id: number;
  type: ToastType;
  message: string;
}

const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />,
  error: <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />,
  info: <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />,
};
const TOAST_STYLES: Record<ToastType, string> = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  error: "border-red-500/30 bg-red-500/10 text-red-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  info: "border-blue-500/30 bg-blue-500/10 text-blue-300",
};

// ─── Status badge helpers ─────────────────────────────────────────────────────
function TeamStatusBadge({ status }: { status: TeamStatus }) {
  const map = {
    APPROVED: {
      label: "Đã duyệt",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    },
    PENDING: {
      label: "Chờ duyệt",
      icon: <Hourglass className="w-3.5 h-3.5" />,
      cls: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    },
    DISQUALIFIED: {
      label: "Bị loại",
      icon: <XCircle className="w-3.5 h-3.5" />,
      cls: "bg-red-500/15 text-red-400 border-red-500/30",
    },
  };
  const { label, icon, cls } = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cls}`}
    >
      {icon}
      {label}
    </span>
  );
}

function RoundStatusBadge({ status }: { status: RoundStatus }) {
  const map: Record<RoundStatus, { label: string; cls: string }> = {
    SUBMISSION_OPEN: {
      label: "Đang mở nộp bài",
      cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    },
    CALIBRATION: {
      label: "Hiệu chuẩn GK",
      cls: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    },
    EVALUATION: {
      label: "Đang chấm điểm",
      cls: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    },
    COMPLETED: {
      label: "Đã hoàn thành",
      cls: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    },
  };
  const { label, cls } = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cls}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const router = useRouter();

  // ── State ──
  const [user, setUser] = useState<UserMe | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [selectedRound, setSelectedRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [repoUrl, setRepoUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const toastCounter = useRef(0);

  // ── Toast helpers ──
  function addToast(type: ToastType, message: string) {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      5000
    );
  }
  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  // ── Fetch user & rounds ──
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const me: UserMe = await fetchWithAuth("/users/me");
      setUser(me);

      // Fetch rounds for the active event
      try {
        const roundsData = await fetchWithAuth("/rounds/my-event");
        setRounds(Array.isArray(roundsData) ? roundsData : roundsData.rounds || []);
      } catch {
        // If endpoint not available yet, use empty — backend may vary
        setRounds([]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi tải dữ liệu.";
      if (msg.toLowerCase().includes("unauthorized") || msg.includes("401")) {
        router.push("/auth/login");
      } else {
        addToast("error", msg);
      }
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    // Guard: check token
    const token = localStorage.getItem("seal_hms_token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    // Hydrate cached user immediately
    const cached = localStorage.getItem("seal_hms_user");
    if (cached) {
      try {
        setUser(JSON.parse(cached));
      } catch { /* ignore */ }
    }
    loadData();
  }, [loadData, router]);

  // Pre-fill form if there's an existing submission
  useEffect(() => {
    if (selectedRound?.mySubmission) {
      setRepoUrl(selectedRound.mySubmission.repoUrl || "");
      setDemoUrl(selectedRound.mySubmission.demoUrl || "");
    } else {
      setRepoUrl("");
      setDemoUrl("");
    }
  }, [selectedRound]);

  function handleLogout() {
    localStorage.removeItem("seal_hms_token");
    localStorage.removeItem("seal_hms_user");
    router.push("/auth/login");
  }

  // ── Derive submission state ──
  function getSubmitBlockReason(round: Round): string | null {
    if (round.status === "CALIBRATION" || round.status === "EVALUATION") {
      return "Bảng điểm đang được xử lý. Ban tổ chức chưa mở lại nộp bài.";
    }
    if (round.status === "COMPLETED") {
      return "Vòng đấu này đã kết thúc. Form nộp bài đã bị khóa.";
    }
    if (round.submissionDeadline && new Date(round.submissionDeadline) < new Date()) {
      return "Đã hết hạn nộp bài cho vòng này.";
    }
    return null;
  }

  // ── Submit handler ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRound || !user?.team) return;

    if (!repoUrl.trim()) {
      addToast("warning", "Vui lòng nhập Link Repository (GitHub).");
      return;
    }
    if (!demoUrl.trim()) {
      addToast("warning", "Vui lòng nhập Link Demo sản phẩm.");
      return;
    }

    setSubmitLoading(true);
    try {
      await fetchWithAuth("/submissions", {
        method: "POST",
        body: JSON.stringify({
          roundId: selectedRound.id,
          teamId: user.team.id,
          repoUrl: repoUrl.trim(),
          demoUrl: demoUrl.trim(),
        }),
      });
      addToast("success", "Nộp bài thành công! Ban tổ chức sẽ xem xét.");
      // Refresh to get updated submission status
      await loadData();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Nộp bài thất bại. Thử lại.";

      // ── Granular business error handling ──
      if (
        msg.toLowerCase().includes("vòng trước") ||
        msg.toLowerCase().includes("previous round") ||
        msg.toLowerCase().includes("completed")
      ) {
        addToast(
          "error",
          "⛔ Vòng trước chưa kết thúc (chưa ở trạng thái COMPLETED). Ban tổ chức chưa mở vòng tiếp theo."
        );
      } else if (
        msg.toLowerCase().includes("top") ||
        msg.toLowerCase().includes("không được thăng hạng") ||
        msg.toLowerCase().includes("not qualified") ||
        msg.toLowerCase().includes("eliminated")
      ) {
        addToast(
          "error",
          "🚫 Đội bạn không nằm trong Top N được thăng hạng vòng trước. Bạn không có quyền nộp bài vòng này."
        );
      } else if (
        msg.toLowerCase().includes("deadline") ||
        msg.toLowerCase().includes("hết hạn") ||
        msg.toLowerCase().includes("expired")
      ) {
        addToast("error", "⏰ Đã hết hạn nộp bài. Form đã bị khóa bởi hệ thống.");
      } else {
        addToast("error", msg);
      }
    } finally {
      setSubmitLoading(false);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER: Loading skeleton
  // ──────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="relative min-h-screen bg-[#080b11] flex items-center justify-center">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-orange-600/15 blur-[120px] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/30 animate-pulse">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
          <p className="text-slate-400 text-sm">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  const team = user?.team;
  const isLeader = team?.isLeader ?? false;
  const isDisqualified = team?.status === "DISQUALIFIED";
  const blockReason = selectedRound ? getSubmitBlockReason(selectedRound) : null;
  const canSubmit = isLeader && !isDisqualified && !blockReason;

  return (
    <div className="relative min-h-screen bg-[#080b11] overflow-x-hidden">
      {/* ── Ambient orbs ── */}
      <div className="absolute top-0 left-[30%] w-[500px] h-[500px] rounded-full bg-orange-600/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-[10%] w-[400px] h-[400px] rounded-full bg-blue-700/8 blur-[120px] pointer-events-none" />

      {/* ── Toast Stack ── */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm shadow-xl animate-fade-in ${TOAST_STYLES[t.type]}`}
            style={{
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            {TOAST_ICONS[t.type]}
            <span className="flex-1 leading-snug">{t.message}</span>
            <button
              onClick={() => dismissToast(t.id)}
              className="text-current opacity-60 hover:opacity-100 transition-opacity mt-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* ── DISQUALIFIED Banner ── */}
      {isDisqualified && (
        <div
          className="relative z-20 w-full border-b border-red-500/30"
          style={{
            background:
              "linear-gradient(135deg, rgba(220,38,38,0.18), rgba(185,28,28,0.12))",
            backdropFilter: "blur(16px)",
          }}
        >
          <div className="max-w-5xl mx-auto px-6 py-5 flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-red-300 font-bold text-base flex items-center gap-2">
                🚫 Đội thi của bạn đã bị loại khỏi giải đấu
              </p>
              <p className="text-red-400/80 text-sm mt-1 leading-relaxed">
                <span className="font-semibold text-red-300">Lý do: </span>
                {team?.disqualificationReason ||
                  "Ban tổ chức không cung cấp lý do cụ thể. Vui lòng liên hệ trực tiếp để biết thêm chi tiết."}
              </p>
              <p className="text-red-500/60 text-xs mt-2">
                Bạn vẫn có thể xem các bài nộp trước đây nhưng không thể thực hiện thêm thao tác nào.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Navbar ── */}
      <header
        className="sticky top-0 z-30 border-b border-white/[0.06]"
        style={{
          background: "rgba(8, 11, 17, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow shadow-orange-500/30">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-sm">SEAL-HMS</span>
              <span className="hidden sm:inline text-slate-500 text-xs ml-2">
                · Thí sinh
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              title="Tải lại dữ liệu"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-[10px] font-bold text-white">
                {user?.name?.[0]?.toUpperCase() || "S"}
              </div>
              <span className="text-sm text-slate-300 font-medium">
                {user?.name || "Thí sinh"}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* ══ SECTION 1: Team Info ══ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Thông tin Đội thi
            </h2>
          </div>

          {!team ? (
            // No team yet
            <div
              className="rounded-2xl p-8 border border-dashed border-slate-700/60 text-center"
              style={{ background: "rgba(15,23,42,0.3)" }}
            >
              <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">Chưa thuộc đội thi nào</p>
              <p className="text-slate-600 text-sm mt-1">
                Bạn chưa được thêm vào đội hoặc đội chưa được tạo. Liên hệ Ban tổ chức.
              </p>
            </div>
          ) : (
            <div
              className="rounded-2xl p-6 border border-white/[0.06]"
              style={{
                background: "rgba(15, 23, 42, 0.5)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                {/* Team identity */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-400/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-7 h-7 text-orange-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl font-bold text-white">{team.name}</h1>
                      {isLeader && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/25">
                          <Star className="w-2.5 h-2.5" />
                          Đội trưởng
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <TeamStatusBadge status={team.status} />
                      <span className="text-xs text-slate-500">
                        {team.members.length} thành viên
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pending info */}
                {team.status === "PENDING" && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/8 border border-amber-500/20 text-amber-400 text-xs">
                    <Hourglass className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Đang chờ Ban tổ chức phê duyệt đội</span>
                  </div>
                )}
              </div>

              {/* Members list */}
              {team.members.length > 0 && (
                <div className="mt-5 pt-5 border-t border-white/[0.05]">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                    Danh sách thành viên
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {team.members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40"
                      >
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                          {m.name[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-white font-medium truncate">
                            {m.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{m.email}</p>
                        </div>
                        {m.isLeader && (
                          <Star className="w-3.5 h-3.5 text-orange-400 ml-auto flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ══ SECTION 2: Rounds & Submission ══ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Vòng thi & Nộp bài
            </h2>
          </div>

          {rounds.length === 0 ? (
            <div
              className="rounded-2xl p-8 border border-dashed border-slate-700/60 text-center"
              style={{ background: "rgba(15,23,42,0.3)" }}
            >
              <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">Chưa có vòng thi nào</p>
              <p className="text-slate-600 text-sm mt-1">
                Ban tổ chức chưa tạo vòng thi cho sự kiện này.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Round selector tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {rounds.map((round) => (
                  <button
                    key={round.id}
                    onClick={() =>
                      setSelectedRound(selectedRound?.id === round.id ? null : round)
                    }
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
                      selectedRound?.id === round.id
                        ? "border-orange-500/50 bg-orange-500/10 text-orange-300"
                        : "border-slate-700/50 bg-slate-800/30 text-slate-400 hover:border-slate-600 hover:text-slate-300"
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-slate-700 text-[10px] font-bold flex items-center justify-center text-slate-300">
                      {round.roundNumber}
                    </span>
                    {round.name}
                    <RoundStatusBadge status={round.status} />
                  </button>
                ))}
              </div>

              {/* Selected round panel */}
              {selectedRound && (
                <div
                  className="rounded-2xl border border-white/[0.06] overflow-hidden"
                  style={{
                    background: "rgba(15, 23, 42, 0.5)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
                  }}
                >
                  {/* Panel header */}
                  <div className="px-6 pt-6 pb-4 border-b border-white/[0.05] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {selectedRound.name}
                      </h3>
                      {selectedRound.eventName && (
                        <p className="text-sm text-slate-500 mt-0.5">
                          {selectedRound.eventName}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <RoundStatusBadge status={selectedRound.status} />
                      {selectedRound.submissionDeadline && (
                        <span className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock className="w-3.5 h-3.5" />
                          Hạn:{" "}
                          {new Date(selectedRound.submissionDeadline).toLocaleString("vi-VN")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    {/* ── Existing submission display ── */}
                    {selectedRound.mySubmission && (
                      <div className="rounded-xl p-4 bg-emerald-500/5 border border-emerald-500/20">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <p className="text-sm font-semibold text-emerald-400">
                            Bài nộp hiện tại
                          </p>
                          <span className="ml-auto text-xs text-slate-500">
                            {new Date(selectedRound.mySubmission.submittedAt).toLocaleString("vi-VN")}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <a
                            href={selectedRound.mySubmission.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <Github className="w-3.5 h-3.5" />
                            {selectedRound.mySubmission.repoUrl}
                          </a>
                          <a
                            href={selectedRound.mySubmission.demoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            {selectedRound.mySubmission.demoUrl}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* ── Block reason banner ── */}
                    {blockReason && (
                      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/25 text-amber-300 text-sm">
                        <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{blockReason}</span>
                      </div>
                    )}

                    {/* ── Disqualified: Read-only note ── */}
                    {isDisqualified && (
                      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/25 text-red-300 text-sm">
                        <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>
                          Đội thi đã bị loại. Không thể nộp bài mới.
                        </span>
                      </div>
                    )}

                    {/* ── Non-leader: Read-only note ── */}
                    {!isLeader && !isDisqualified && (
                      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-blue-500/8 border border-blue-500/25 text-blue-300 text-sm">
                        <Eye className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>
                          Chỉ{" "}
                          <span className="font-semibold text-blue-200">
                            Đội trưởng
                          </span>{" "}
                          mới có quyền nộp bài. Bạn đang ở chế độ xem (Read-only).
                        </span>
                      </div>
                    )}

                    {/* ── Submission Form ── */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Repo URL */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                          <span className="flex items-center gap-1.5">
                            <Github className="w-3.5 h-3.5 text-slate-400" />
                            Link Repository (GitHub)
                            {canSubmit && (
                              <span className="text-orange-500">*</span>
                            )}
                          </span>
                        </label>
                        <input
                          id="submission-repo-url"
                          type="url"
                          value={repoUrl}
                          onChange={(e) => setRepoUrl(e.target.value)}
                          disabled={!canSubmit}
                          placeholder="https://github.com/your-team/project"
                          className={`w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500
                            border transition-all duration-200
                            focus:outline-none
                            ${
                              canSubmit
                                ? "bg-slate-800/60 border-slate-700/60 focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30"
                                : "bg-slate-800/20 border-slate-700/30 cursor-not-allowed opacity-50"
                            }`}
                        />
                      </div>

                      {/* Demo URL */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                          <span className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-slate-400" />
                            Link Demo (Vercel / Netlify / Heroku)
                            {canSubmit && (
                              <span className="text-orange-500">*</span>
                            )}
                          </span>
                        </label>
                        <input
                          id="submission-demo-url"
                          type="url"
                          value={demoUrl}
                          onChange={(e) => setDemoUrl(e.target.value)}
                          disabled={!canSubmit}
                          placeholder="https://your-project.vercel.app"
                          className={`w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500
                            border transition-all duration-200
                            focus:outline-none
                            ${
                              canSubmit
                                ? "bg-slate-800/60 border-slate-700/60 focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30"
                                : "bg-slate-800/20 border-slate-700/30 cursor-not-allowed opacity-50"
                            }`}
                        />
                      </div>

                      {/* Submit Button */}
                      {isLeader && (
                        <div className="pt-1">
                          {canSubmit ? (
                            <button
                              type="submit"
                              id="submit-project-btn"
                              disabled={submitLoading}
                              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl font-semibold text-white
                                bg-gradient-to-r from-orange-600 to-orange-500
                                hover:from-orange-500 hover:to-amber-500
                                shadow-lg shadow-orange-500/25
                                hover:shadow-orange-500/40 hover:scale-[1.02]
                                active:scale-[0.98]
                                disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100
                                transition-all duration-200"
                            >
                              {submitLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <Send className="w-5 h-5" />
                              )}
                              {submitLoading
                                ? "Đang nộp bài..."
                                : selectedRound.mySubmission
                                ? "Cập nhật bài nộp"
                                : "Nộp bài thi"}
                            </button>
                          ) : (
                            <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-slate-800/40 border border-slate-700/40 w-full sm:w-auto inline-flex">
                              <Lock className="w-4 h-4 text-slate-500" />
                              <span className="text-sm text-slate-500 font-medium">
                                Form nộp bài đã bị khóa
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </form>

                    {/* Round progress hint */}
                    {selectedRound.status === "SUBMISSION_OPEN" && !isDisqualified && (
                      <div className="flex items-center gap-2 pt-2">
                        <div className="flex gap-1.5">
                          {(
                            [
                              "SUBMISSION_OPEN",
                              "CALIBRATION",
                              "EVALUATION",
                              "COMPLETED",
                            ] as RoundStatus[]
                          ).map((s) => (
                            <div
                              key={s}
                              className={`h-1 rounded-full transition-all ${
                                s === selectedRound.status
                                  ? "w-8 bg-orange-500"
                                  : "w-4 bg-slate-700"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-slate-600">
                          Trạng thái vòng đấu hiện tại
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ══ SECTION 3: Quick Guide ══ */}
        <section>
          <div
            className="rounded-2xl p-5 border border-white/[0.04]"
            style={{ background: "rgba(15, 23, 42, 0.3)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-blue-400" />
              <p className="text-sm font-semibold text-slate-400">
                Hướng dẫn nộp bài
              </p>
            </div>
            <ul className="space-y-2 text-xs text-slate-500">
              {[
                {
                  icon: <Star className="w-3 h-3 text-orange-400" />,
                  text: "Chỉ Đội trưởng mới có thể nộp hoặc cập nhật bài thi.",
                },
                {
                  icon: <ChevronRight className="w-3 h-3 text-slate-600" />,
                  text: "Link Repository phải là URL GitHub công khai (public) hoặc có quyền truy cập.",
                },
                {
                  icon: <ChevronRight className="w-3 h-3 text-slate-600" />,
                  text: "Link Demo phải là URL có thể truy cập công khai (Vercel, Netlify, Heroku, ...).",
                },
                {
                  icon: <Lock className="w-3 h-3 text-slate-600" />,
                  text: "Form tự động khóa khi vòng chuyển sang giai đoạn Chấm điểm hoặc đã hết hạn.",
                },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 flex-shrink-0">{item.icon}</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
