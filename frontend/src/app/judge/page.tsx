"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Scale,
  Star,
  CheckCircle2,
  XCircle,
  Lock,
  Loader2,
  LogOut,
  RefreshCw,
  ChevronRight,
  AlertTriangle,
  Info,
  MessageSquare,
  Trophy,
  Send,
  Eye,
  ClipboardList,
  BarChart3,
  Users,
  X,
  User,
  Layers,
  BookOpen,
  Gauge,
  Github,
  Globe,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
type RoundStatus =
  | "UPCOMING"
  | "SUBMISSION_OPEN"
  | "SUBMISSION_CLOSED"
  | "CALIBRATION"
  | "EVALUATION"
  | "COMPLETED";

interface JudgeRound {
  id: string;
  name: string;
  sequenceNumber: number;
  status: RoundStatus;
  eventId?: string;
  eventName?: string;
  // criteria come directly from /rounds/event/:eventId
  criteria?: Criterion[];
  judges?: Array<{
    userId: string;
    user: { id: string; fullName: string; email: string };
  }>;
}

interface CalibrationSample {
  id: string;
  title: string;
  description?: string;
  repoUrl?: string;
  demoUrl?: string;
  referenceScore?: number;
}

interface Criterion {
  id: string;
  name: string;
  description?: string;
  maxPoints: number;
  weight: number;
  isTechnical: boolean;
}

interface Submission {
  id: string;
  teamName: string;
  teamId: string;
  repoUrl?: string;
  demoUrl?: string;
  submittedAt: string;
  myScoreStatus: "NOT_SCORED" | "SCORED";
  team?: { name: string };
}

interface CriterionScore {
  criterionId: string;
  scoreValue: number | "";  // backend uses scoreValue
  comments: string;          // backend uses comments
}

// ─── Toast ───────────────────────────────────────────────────────────────────
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

// ─── Score Input ──────────────────────────────────────────────────────────────
function ScoreInput({
  value,
  max,
  disabled,
  onChange,
  id,
}: {
  value: number | "";
  max: number;
  disabled: boolean;
  onChange: (v: number) => void;
  id: string;
}) {
  const numeric = typeof value === "number" ? value : 0;
  const pct = (numeric / max) * 100;
  const color =
    pct >= 80
      ? "from-emerald-500 to-emerald-400"
      : pct >= 50
      ? "from-orange-500 to-amber-400"
      : "from-red-500 to-red-400";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <input
          id={id}
          type="number"
          min={0}
          max={max}
          step={0.5}
          value={value}
          disabled={disabled}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(Math.min(max, Math.max(0, v)));
          }}
          className={`w-20 px-3 py-1.5 rounded-lg text-sm font-bold text-center border transition-all
            focus:outline-none
            ${
              disabled
                ? "bg-slate-800/20 border-slate-700/30 text-slate-500 cursor-not-allowed"
                : "bg-slate-800/70 border-orange-500/40 text-orange-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
            }`}
        />
        <span className="text-xs text-slate-500">
          / <span className="text-slate-400 font-medium">{max}</span>
        </span>
      </div>
      {/* Progress bar */}
      <div className="h-2 rounded-full bg-slate-700/60 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {/* Range slider */}
      {!disabled && (
        <input
          type="range"
          min={0}
          max={max}
          step={0.5}
          value={numeric}
          disabled={disabled}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full accent-orange-500 cursor-pointer h-1 opacity-70"
        />
      )}
    </div>
  );
}

// ─── Round Status Badge ───────────────────────────────────────────────────────
function RoundStatusBadge({ status }: { status: RoundStatus }) {
  const map: Record<RoundStatus, { label: string; cls: string }> = {
    UPCOMING: {
      label: "Sắp diễn ra",
      cls: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    },
    SUBMISSION_OPEN: {
      label: "Mở nộp bài",
      cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    },
    SUBMISSION_CLOSED: {
      label: "Đóng nộp bài",
      cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    },
    CALIBRATION: {
      label: "Chấm thử",
      cls: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    },
    EVALUATION: {
      label: "Chấm chính thức",
      cls: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    },
    COMPLETED: {
      label: "Đã hoàn thành",
      cls: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    },
  };
  const { label, cls } = map[status] || { label: "Sắp diễn ra", cls: "bg-slate-500/15 text-slate-400 border-slate-500/30" };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function JudgeDashboard() {
  const router = useRouter();

  // ── Core state ──
  const [judgeInfo, setJudgeInfo] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);
  const [rounds, setRounds] = useState<JudgeRound[]>([]);
  const [selectedRound, setSelectedRound] = useState<JudgeRound | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // ── Calibration state ──
  const [calibSample, setCalibSample] = useState<CalibrationSample | null>(null);
  const [calibScores, setCalibScores] = useState<CriterionScore[]>([]);
  const [calibGlobalComment, setCalibGlobalComment] = useState("");
  const [calibLoading, setCalibLoading] = useState(false);
  const [calibSubmitting, setCalibSubmitting] = useState(false);
  const [calibCriteria, setCalibCriteria] = useState<Criterion[]>([]);

  // ── Evaluation state ──
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [evalCriteria, setEvalCriteria] = useState<Criterion[]>([]);
  const [evalScores, setEvalScores] = useState<CriterionScore[]>([]);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalSubmitting, setEvalSubmitting] = useState(false);

  // ── Toast helpers ──
  function addToast(type: ToastType, message: string) {
    const id = ++_toastId;
    setToasts((p) => [...p, { id, type, message }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 5500);
  }

  // ── Load judge info & rounds ──
  // Strategy:
  // 1. GET /auth/me → get judge id
  // 2. GET /events → iterate events, GET /rounds/event/:id → filter rounds where judges[].userId === judgeId
  const loadRounds = useCallback(async () => {
    setPageLoading(true);
    try {
      // Step 1: Get current user via /auth/me
      const meRes = await fetchWithAuth("/auth/me");
      const me = meRes.data?.user ?? meRes.user ?? meRes;
      const judgeId = me.id;
      setJudgeInfo({ id: judgeId, name: me.fullName ?? me.name, email: me.email });

      // Step 2: Get all events then fetch rounds per event
      const eventsRes = await fetchWithAuth("/events");
      const events: Array<{ id: string; name: string }> =
        eventsRes.data ?? eventsRes;

      if (!Array.isArray(events) || events.length === 0) {
        setRounds([]);
        return;
      }

      const allJudgeRounds: JudgeRound[] = [];
      for (const event of events) {
        try {
          const roundsRes = await fetchWithAuth(`/rounds/event/${event.id}`);
          const eventRounds: JudgeRound[] = roundsRes.data ?? roundsRes;
          if (!Array.isArray(eventRounds)) continue;

          // Only include rounds where this judge is assigned
          const myRounds = eventRounds.filter((r) =>
            r.judges?.some((j) => j.userId === judgeId)
          );
          myRounds.forEach((r) => {
            allJudgeRounds.push({ ...r, eventName: event.name });
          });
        } catch {
          // Skip events we can't read
        }
      }
      setRounds(allJudgeRounds);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi tải dữ liệu.";
      if (msg.includes("401") || msg.toLowerCase().includes("unauthorized")) {
        router.push("/auth/login");
      } else {
        addToast("error", msg);
      }
    } finally {
      setPageLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("seal_hms_token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    const cached = localStorage.getItem("seal_hms_user");
    if (cached) {
      try {
        const u = JSON.parse(cached);
        setJudgeInfo({
          id: u.id ?? "",
          name: u.fullName ?? u.name,
          email: u.email,
        });
      } catch { /* ignore */ }
    }
    loadRounds();
  }, [loadRounds, router]);

  // ── Load calibration sample when round is CALIBRATION ──
  useEffect(() => {
    if (!selectedRound || selectedRound.status !== "CALIBRATION") {
      setCalibSample(null);
      setCalibScores([]);
      setCalibGlobalComment("");
      setCalibCriteria([]);
      return;
    }

    // Use criteria from the round data (already fetched)
    const criteria = selectedRound.criteria ?? [];
    setCalibCriteria(criteria);
    setCalibScores(
      criteria.map((c) => ({ criterionId: c.id, scoreValue: "", comments: "" }))
    );

    // Fetch calibration sample for this round
    setCalibLoading(true);
    fetchWithAuth(`/calibration/samples/round/${selectedRound.id}`)
      .then((data) => {
        // Backend returns an array — take the first sample
        const samples: CalibrationSample[] = Array.isArray(data)
          ? data
          : data.data ?? [];
        if (samples.length > 0) {
          setCalibSample(samples[0]);
        } else {
          setCalibSample(null);
        }
      })
      .catch((err: unknown) => {
        addToast(
          "error",
          err instanceof Error ? err.message : "Không lấy được dự án mẫu."
        );
        setCalibSample(null);
      })
      .finally(() => setCalibLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRound?.id, selectedRound?.status]);

  // ── Load submissions when round is EVALUATION ──
  useEffect(() => {
    if (!selectedRound || selectedRound.status !== "EVALUATION") {
      setSubmissions([]);
      setSelectedSub(null);
      return;
    }
    setEvalLoading(true);
    // Correct endpoint: /submissions/round/:roundId (NOT /rounds/:id/judge)
    fetchWithAuth(`/submissions/round/${selectedRound.id}`)
      .then((data) => {
        const raw: any[] = Array.isArray(data) ? data : data.data ?? [];
        // Normalize: teamName may come from team.name
        const list: Submission[] = raw.map((s) => ({
          ...s,
          teamName: s.teamName ?? s.team?.name ?? "Unnamed Team",
          myScoreStatus: s.myScoreStatus ?? "NOT_SCORED",
        }));
        setSubmissions(list);

        // Set criteria from round data
        setEvalCriteria(selectedRound.criteria ?? []);
      })
      .catch((err: unknown) =>
        addToast("error", err instanceof Error ? err.message : "Lỗi tải danh sách bài nộp.")
      )
      .finally(() => setEvalLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRound?.id, selectedRound?.status]);

  // ── When submission selected, init eval scores from round criteria ──
  useEffect(() => {
    if (!selectedSub) return;
    const criteria = selectedRound?.criteria ?? [];
    setEvalCriteria(criteria);
    setEvalScores(
      criteria.map((c) => ({ criterionId: c.id, scoreValue: "", comments: "" }))
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSub?.id]);

  function handleLogout() {
    localStorage.removeItem("seal_hms_token");
    localStorage.removeItem("seal_hms_user");
    router.push("/auth/login");
  }

  // ── Score update helpers ──
  function updateCalibScore(
    idx: number,
    field: "scoreValue" | "comments",
    val: number | string
  ) {
    setCalibScores((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: val } : s))
    );
  }

  function updateEvalScore(
    idx: number,
    field: "scoreValue" | "comments",
    val: number | string
  ) {
    setEvalScores((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: val } : s))
    );
  }

  // ── Submit calibration scores ──
  async function handleCalibSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!calibSample) return;

    // Validate
    for (let i = 0; i < calibScores.length; i++) {
      if (calibScores[i].scoreValue === "") {
        addToast(
          "warning",
          `Vui lòng nhập điểm cho tiêu chí "${calibCriteria[i]?.name}".`
        );
        return;
      }
      if (!calibScores[i].comments.trim()) {
        addToast(
          "warning",
          `Bình luận cho tiêu chí "${calibCriteria[i]?.name}" là bắt buộc.`
        );
        return;
      }
    }
    if (!calibGlobalComment.trim()) {
      addToast("warning", "Vui lòng nhập nhận xét tổng thể cho bài chấm thử.");
      return;
    }

    setCalibSubmitting(true);
    try {
      // POST /calibration/samples/:sampleId/scores
      // Body: { scores: [{criterionId, scoreValue, comments}] }
      // Note: backend does not support globalComment in this version — we include it anyway
      await fetchWithAuth(`/calibration/samples/${calibSample.id}/scores`, {
        method: "POST",
        body: JSON.stringify({
          scores: calibScores.map((s) => ({
            criterionId: s.criterionId,
            scoreValue: s.scoreValue,
            comments: s.comments,
          })),
          globalComment: calibGlobalComment,
        }),
      });
      addToast("success", "Nộp điểm chấm thử thành công! Hệ thống đã ghi nhận kết quả.");
    } catch (err: unknown) {
      addToast("error", err instanceof Error ? err.message : "Nộp điểm thất bại.");
    } finally {
      setCalibSubmitting(false);
    }
  }

  // ── Submit evaluation scores ──
  async function handleEvalSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSub) return;

    for (let i = 0; i < evalScores.length; i++) {
      if (evalScores[i].scoreValue === "") {
        addToast(
          "warning",
          `Vui lòng nhập điểm cho tiêu chí "${evalCriteria[i]?.name}".`
        );
        return;
      }
    }

    setEvalSubmitting(true);
    try {
      // POST /scores/submission/:submissionId (singular "submission")
      // Body: { scores: [{criterionId, scoreValue, comments}] }
      await fetchWithAuth(`/scores/submission/${selectedSub.id}`, {
        method: "POST",
        body: JSON.stringify({
          scores: evalScores.map((s) => ({
            criterionId: s.criterionId,
            scoreValue: s.scoreValue,
            comments: s.comments,
          })),
        }),
      });
      addToast("success", `Điểm của đội "${selectedSub.teamName}" đã được ghi nhận.`);
      // Mark as scored in list
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === selectedSub.id ? { ...s, myScoreStatus: "SCORED" } : s
        )
      );
      setSelectedSub(null);
    } catch (err: unknown) {
      addToast("error", err instanceof Error ? err.message : "Nộp điểm thất bại.");
    } finally {
      setEvalSubmitting(false);
    }
  }

  // ── Computed: Is scoring locked? ──
  const isLocked =
    !selectedRound ||
    selectedRound.status === "COMPLETED" ||
    selectedRound.status === "SUBMISSION_OPEN";

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  if (pageLoading) {
    return (
      <div className="min-h-screen bg-[#080b11] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/30 animate-pulse">
            <Scale className="w-8 h-8 text-white" />
          </div>
          <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
          <p className="text-slate-400 text-sm">Đang tải bảng chấm điểm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#080b11] overflow-x-hidden">
      {/* Ambient orbs */}
      <div className="absolute top-0 left-[20%] w-[500px] h-[500px] rounded-full bg-purple-700/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-[10%] w-[400px] h-[400px] rounded-full bg-orange-600/8 blur-[130px] pointer-events-none" />

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

      {/* ── Navbar ── */}
      <header
        className="sticky top-0 z-30 border-b border-white/[0.06]"
        style={{
          background: "rgba(8,11,17,0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow shadow-orange-500/30">
              <Scale className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-sm">SEAL-HMS</span>
              <span className="hidden sm:inline text-slate-500 text-xs ml-2">
                · Giám khảo
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadRounds}
              title="Làm mới"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">
                {judgeInfo?.name?.[0]?.toUpperCase() || "J"}
              </div>
              <span className="text-sm text-slate-300 font-medium">
                {judgeInfo?.name || "Giám khảo"}
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

      {/* ── Main layout: sidebar + content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex gap-6">

        {/* ══ LEFT: Round Sidebar ══ */}
        <aside className="flex-shrink-0 w-56 hidden lg:block">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3 px-1">
            Vòng được phân công
          </p>
          <div className="space-y-1.5">
            {rounds.length === 0 ? (
              <p className="text-xs text-slate-600 px-1">Chưa có vòng nào.</p>
            ) : (
              rounds.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setSelectedRound(r);
                    setSelectedSub(null);
                  }}
                  className={`w-full flex flex-col gap-1.5 px-3 py-3 rounded-xl text-left border transition-all duration-200 ${
                    selectedRound?.id === r.id
                      ? "border-orange-500/40 bg-orange-500/8"
                      : "border-transparent hover:border-slate-700/60 hover:bg-slate-800/30"
                  }`}
                >
                  <span
                    className={`text-xs text-slate-500 font-medium`}
                  >
                    {r.eventName}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      selectedRound?.id === r.id
                        ? "text-orange-300"
                        : "text-slate-300"
                    }`}
                  >
                    {r.name}
                  </span>
                  <RoundStatusBadge status={r.status} />
                </button>
              ))
            )}
          </div>
        </aside>

        {/* ══ RIGHT: Content panel ══ */}
        <main className="flex-1 min-w-0 space-y-5">

          {/* Mobile round selector */}
          <div className="lg:hidden">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Chọn vòng
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {rounds.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setSelectedRound(r);
                    setSelectedSub(null);
                  }}
                  className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-all ${
                    selectedRound?.id === r.id
                      ? "border-orange-500/40 bg-orange-500/8 text-orange-300"
                      : "border-slate-700/50 bg-slate-800/30 text-slate-400"
                  }`}
                >
                  {r.name}
                  <RoundStatusBadge status={r.status} />
                </button>
              ))}
            </div>
          </div>

          {/* ── No round selected ── */}
          {!selectedRound && (
            <div
              className="rounded-2xl p-12 border border-dashed border-slate-700/50 text-center"
              style={{ background: "rgba(15,23,42,0.3)" }}
            >
              <ClipboardList className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">Chọn một vòng thi để bắt đầu</p>
              <p className="text-slate-600 text-sm mt-1">
                Danh sách vòng thi được phân công hiển thị ở bên trái.
              </p>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              LOCKED BANNER — COMPLETED / SUBMISSION_OPEN
          ═══════════════════════════════════════════════════ */}
          {selectedRound && isLocked && (
            <div
              className="rounded-2xl border border-slate-600/30 overflow-hidden"
              style={{
                background: "rgba(15,23,42,0.5)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
              }}
            >
              {/* Lock banner */}
              <div
                className="px-6 py-5 border-b border-slate-700/30"
                style={{ background: "rgba(100,116,139,0.08)" }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-700/50 border border-slate-600/40 flex items-center justify-center flex-shrink-0">
                    <Lock className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-200 text-base flex items-center gap-2">
                      🔒 Bảng điểm đã được khóa
                    </p>
                    <p className="text-slate-400 text-sm mt-0.5">
                      {selectedRound.status === "COMPLETED"
                        ? "Vòng thi đã kết thúc. Tất cả điểm số đã được chốt và không thể thay đổi."
                        : "Vòng đang mở cho thí sinh nộp bài. Chưa đến giai đoạn chấm điểm."}
                    </p>
                  </div>
                  <RoundStatusBadge status={selectedRound.status} />
                </div>
              </div>
              {/* Read-only info */}
              <div className="px-6 py-6">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="w-4 h-4 text-slate-500" />
                  <p className="text-sm font-medium text-slate-400">
                    Chế độ xem — Read-only
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      icon: <BarChart3 className="w-5 h-5 text-slate-500" />,
                      label: "Điểm trung bình",
                      value: "—",
                    },
                    {
                      icon: <Users className="w-5 h-5 text-slate-500" />,
                      label: "Số đội đã chấm",
                      value: "—",
                    },
                    {
                      icon: <Trophy className="w-5 h-5 text-slate-500" />,
                      label: "Vòng",
                      value: selectedRound.name,
                    },
                  ].map((card, i) => (
                    <div
                      key={i}
                      className="px-4 py-3 rounded-xl bg-slate-800/30 border border-slate-700/30"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {card.icon}
                        <p className="text-xs text-slate-500">{card.label}</p>
                      </div>
                      <p className="text-lg font-bold text-slate-400">{card.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-blue-300 text-sm">
                  <Info className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Để xem điểm chi tiết, hãy liên hệ Ban tổ chức hoặc chờ kết quả được công bố.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              CALIBRATION PHASE
          ═══════════════════════════════════════════════════ */}
          {selectedRound?.status === "CALIBRATION" && (
            <div className="space-y-5">
              {/* Header */}
              <div
                className="rounded-2xl p-5 border border-purple-500/20"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(109,40,217,0.04))",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center">
                    <Gauge className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      Giai đoạn Chấm thử (Calibration)
                      <RoundStatusBadge status="CALIBRATION" />
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Chấm điểm bài mẫu để đảm bảo sự thống nhất giữa các giám khảo.
                    </p>
                  </div>
                </div>
              </div>

              {calibLoading && (
                <div className="flex items-center gap-3 px-6 py-8 justify-center">
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                  <span className="text-slate-400 text-sm">Đang tải dự án mẫu...</span>
                </div>
              )}

              {!calibLoading && !calibSample && (
                <div
                  className="rounded-2xl p-8 border border-dashed border-purple-500/20 text-center"
                  style={{ background: "rgba(15,23,42,0.3)" }}
                >
                  <BookOpen className="w-10 h-10 text-purple-600/50 mx-auto mb-3" />
                  <p className="text-slate-400 font-medium">Chưa có dự án mẫu</p>
                  <p className="text-slate-600 text-sm mt-1">
                    Ban tổ chức chưa thiết lập bài chấm thử cho vòng này.
                  </p>
                </div>
              )}

              {!calibLoading && calibSample && (
                <div
                  className="rounded-2xl border border-white/[0.06] overflow-hidden"
                  style={{
                    background: "rgba(15,23,42,0.55)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
                  }}
                >
                  {/* Sample project info */}
                  <div className="px-6 pt-6 pb-4 border-b border-white/[0.05]">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <BookOpen className="w-4 h-4 text-purple-400" />
                          <span className="text-xs text-purple-400 font-medium uppercase tracking-wide">
                            Dự án mẫu chấm thử
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-white">
                          {calibSample.title}
                        </h3>
                        {calibSample.description && (
                          <p className="text-slate-400 text-sm mt-1 max-w-xl">
                            {calibSample.description}
                          </p>
                        )}
                      </div>
                      {calibSample.referenceScore !== undefined && (
                        <div className="px-4 py-3 rounded-xl bg-purple-500/10 border border-purple-500/25 text-center">
                          <p className="text-xs text-purple-400">Điểm tham chiếu</p>
                          <p className="text-2xl font-black text-purple-300 mt-0.5">
                            {calibSample.referenceScore}
                          </p>
                        </div>
                      )}
                    </div>
                    {(calibSample.repoUrl || calibSample.demoUrl) && (
                      <div className="flex gap-4 mt-3 flex-wrap">
                        {calibSample.repoUrl && (
                          <a
                            href={calibSample.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <Github className="w-3.5 h-3.5" />
                            Repository
                          </a>
                        )}
                        {calibSample.demoUrl && (
                          <a
                            href={calibSample.demoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            Demo
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Calibration scoring form */}
                  <form onSubmit={handleCalibSubmit} className="p-6 space-y-6">
                    {calibCriteria.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-4">
                        Vòng này chưa có tiêu chí chấm điểm nào.
                      </p>
                    ) : (
                      <div className="space-y-5">
                        {calibCriteria.map((criterion, idx) => {
                          const cs = calibScores[idx];
                          return (
                            <div
                              key={criterion.id}
                              className="rounded-xl p-5 border border-white/[0.05] space-y-4"
                              style={{ background: "rgba(30,41,59,0.4)" }}
                            >
                              {/* Criterion header */}
                              <div className="flex items-start justify-between gap-3 flex-wrap">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className="text-sm font-semibold text-white">
                                      {idx + 1}. {criterion.name}
                                    </span>
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                        criterion.isTechnical
                                          ? "bg-blue-500/15 text-blue-400 border-blue-500/25"
                                          : "bg-amber-500/15 text-amber-400 border-amber-500/25"
                                      }`}
                                    >
                                      {criterion.isTechnical ? "Kỹ thuật" : "Khác"}
                                    </span>
                                  </div>
                                  {criterion.description && (
                                    <p className="text-xs text-slate-500">
                                      {criterion.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-2 text-xs text-slate-500 flex-shrink-0">
                                  <span className="px-2 py-1 rounded-lg bg-slate-700/40 border border-slate-700/50">
                                    Trọng số:{" "}
                                    <span className="font-semibold text-slate-300">
                                      {criterion.weight}%
                                    </span>
                                  </span>
                                  <span className="px-2 py-1 rounded-lg bg-slate-700/40 border border-slate-700/50">
                                    Max:{" "}
                                    <span className="font-semibold text-slate-300">
                                      {criterion.maxPoints}
                                    </span>
                                  </span>
                                </div>
                              </div>

                              {/* Score input */}
                              <div>
                                <p className="text-xs font-medium text-slate-400 mb-2">
                                  Điểm số <span className="text-orange-500">*</span>
                                </p>
                                <ScoreInput
                                  id={`calib-score-${criterion.id}`}
                                  value={cs?.scoreValue ?? ""}
                                  max={criterion.maxPoints}
                                  disabled={false}
                                  onChange={(v) => updateCalibScore(idx, "scoreValue", v)}
                                />
                              </div>

                              {/* Comment — REQUIRED */}
                              <div>
                                <label
                                  htmlFor={`calib-comment-${criterion.id}`}
                                  className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-2"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  Bình luận / Nhận xét{" "}
                                  <span className="text-red-400">* (bắt buộc)</span>
                                </label>
                                <textarea
                                  id={`calib-comment-${criterion.id}`}
                                  rows={2}
                                  value={cs?.comments || ""}
                                  onChange={(e) =>
                                    updateCalibScore(idx, "comments", e.target.value)
                                  }
                                  placeholder="Nhận xét chi tiết về tiêu chí này..."
                                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-600
                                    bg-slate-800/60 border border-slate-700/60 resize-none
                                    focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30
                                    transition-all duration-200"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Global comment */}
                    <div>
                      <label
                        htmlFor="calib-global-comment"
                        className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-2"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-400" />
                        Nhận xét tổng thể{" "}
                        <span className="text-red-400 text-xs">* (bắt buộc)</span>
                      </label>
                      <textarea
                        id="calib-global-comment"
                        rows={3}
                        value={calibGlobalComment}
                        onChange={(e) => setCalibGlobalComment(e.target.value)}
                        placeholder="Chia sẻ nhận xét tổng quan về dự án mẫu này..."
                        className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-600
                          bg-slate-800/60 border border-slate-700/60 resize-none
                          focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30
                          transition-all duration-200"
                      />
                    </div>

                    {/* Submit calibration */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
                      <p className="text-xs text-slate-600">
                        Kết quả chấm thử sẽ được hệ thống phân tích độ đồng thuận (ICC).
                      </p>
                      <button
                        type="submit"
                        id="calib-submit-btn"
                        disabled={calibSubmitting || calibCriteria.length === 0}
                        className="flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-white text-sm
                          bg-gradient-to-r from-purple-600 to-indigo-500
                          hover:from-purple-500 hover:to-indigo-400
                          shadow-lg shadow-purple-500/20 hover:shadow-purple-500/35
                          hover:scale-[1.02] active:scale-[0.98]
                          disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100
                          transition-all duration-200"
                      >
                        {calibSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        {calibSubmitting ? "Đang nộp..." : "Nộp điểm chấm thử"}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              EVALUATION PHASE
          ═══════════════════════════════════════════════════ */}
          {selectedRound?.status === "EVALUATION" && (
            <div className="space-y-5">
              {/* Header */}
              <div
                className="rounded-2xl p-5 border border-orange-500/20"
                style={{
                  background: "linear-gradient(135deg, rgba(234,88,12,0.08), rgba(251,146,60,0.04))",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center">
                    <Layers className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      Giai đoạn Chấm điểm chính thức (Evaluation)
                      <RoundStatusBadge status="EVALUATION" />
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Chọn một đội thi để bắt đầu chấm điểm theo tiêu chí.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                {/* ── Submission list (left) ── */}
                <div className="lg:col-span-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Danh sách bài nộp ({submissions.length})
                  </p>

                  {evalLoading && !submissions.length ? (
                    <div className="flex items-center gap-2 py-8 justify-center">
                      <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
                      <span className="text-slate-500 text-sm">Đang tải...</span>
                    </div>
                  ) : submissions.length === 0 ? (
                    <div
                      className="rounded-2xl p-6 border border-dashed border-slate-700/50 text-center"
                      style={{ background: "rgba(15,23,42,0.3)" }}
                    >
                      <ClipboardList className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-slate-500 text-sm">Chưa có bài nộp nào.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {submissions.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => setSelectedSub(sub)}
                          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all duration-200 group ${
                            selectedSub?.id === sub.id
                              ? "border-orange-500/40 bg-orange-500/8"
                              : "border-slate-700/40 bg-slate-800/20 hover:border-slate-600/60 hover:bg-slate-800/40"
                          }`}
                        >
                          {/* Avatar */}
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                            {sub.teamName[0]?.toUpperCase()}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-semibold truncate ${
                                selectedSub?.id === sub.id
                                  ? "text-orange-300"
                                  : "text-slate-200"
                              }`}
                            >
                              {sub.teamName}
                            </p>
                            <p className="text-xs text-slate-600 mt-0.5">
                              {new Date(sub.submittedAt).toLocaleString("vi-VN")}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {sub.myScoreStatus === "SCORED" ? (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                Đã chấm
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                                Chờ chấm
                              </span>
                            )}
                            <ChevronRight
                              className={`w-4 h-4 transition-all ${
                                selectedSub?.id === sub.id
                                  ? "text-orange-400"
                                  : "text-slate-600 group-hover:text-slate-400"
                              }`}
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Scoring Form (right) ── */}
                <div className="lg:col-span-3">
                  {!selectedSub ? (
                    <div
                      className="rounded-2xl p-10 border border-dashed border-slate-700/50 text-center h-full flex flex-col items-center justify-center"
                      style={{ background: "rgba(15,23,42,0.25)", minHeight: "300px" }}
                    >
                      <Scale className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400 font-medium">Chọn một đội để chấm</p>
                      <p className="text-slate-600 text-sm mt-1">
                        Click vào bài nộp bên trái để mở form chấm điểm.
                      </p>
                    </div>
                  ) : (
                    <div
                      className="rounded-2xl border border-white/[0.06] overflow-hidden"
                      style={{
                        background: "rgba(15,23,42,0.55)",
                        backdropFilter: "blur(16px)",
                        WebkitBackdropFilter: "blur(16px)",
                        boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
                      }}
                    >
                      {/* Form header */}
                      <div className="px-5 pt-5 pb-4 border-b border-white/[0.05] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-400/10 border border-orange-500/20 flex items-center justify-center">
                            <User className="w-4 h-4 text-orange-400" />
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">
                              {selectedSub.teamName}
                            </p>
                            <p className="text-xs text-slate-500">
                              Đội ID: {selectedSub.teamId}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedSub(null)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Links */}
                      {(selectedSub.repoUrl || selectedSub.demoUrl) && (
                        <div className="px-5 py-3 border-b border-white/[0.04] flex gap-4 flex-wrap">
                          {selectedSub.repoUrl && (
                            <a
                              href={selectedSub.repoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              <Github className="w-3 h-3" /> Repository
                            </a>
                          )}
                          {selectedSub.demoUrl && (
                            <a
                              href={selectedSub.demoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              <Globe className="w-3 h-3" /> Demo
                            </a>
                          )}
                        </div>
                      )}

                      {/* Dynamic scoring form */}
                      {evalLoading ? (
                        <div className="flex items-center gap-2 py-10 justify-center">
                          <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
                          <span className="text-slate-400 text-sm">Đang tải tiêu chí...</span>
                        </div>
                      ) : (
                        <form onSubmit={handleEvalSubmit} className="p-5 space-y-4">
                          {evalCriteria.length === 0 && (
                            <div className="py-6 text-center">
                              <p className="text-slate-500 text-sm">
                                Không có tiêu chí chấm điểm nào.
                              </p>
                            </div>
                          )}

                          {evalCriteria.map((criterion, idx) => {
                            const es = evalScores[idx];
                            return (
                              <div
                                key={criterion.id}
                                className="rounded-xl p-4 border border-white/[0.05] space-y-3"
                                style={{ background: "rgba(30,41,59,0.35)" }}
                              >
                                {/* Header row */}
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-semibold text-white">
                                      {idx + 1}. {criterion.name}
                                    </span>
                                    <span
                                      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                                        criterion.isTechnical
                                          ? "bg-blue-500/15 text-blue-400 border-blue-500/25"
                                          : "bg-amber-500/15 text-amber-400 border-amber-500/25"
                                      }`}
                                    >
                                      {criterion.isTechnical ? "Kỹ thuật" : "Khác"}
                                    </span>
                                  </div>
                                  <div className="flex gap-1.5 text-[10px] text-slate-500">
                                    <span className="px-1.5 py-0.5 rounded bg-slate-700/50 border border-slate-700/50">
                                      Trọng số:{" "}
                                      <b className="text-slate-300">{criterion.weight}%</b>
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded bg-slate-700/50 border border-slate-700/50">
                                      Max:{" "}
                                      <b className="text-slate-300">{criterion.maxPoints}</b>
                                    </span>
                                  </div>
                                </div>

                                {criterion.description && (
                                  <p className="text-xs text-slate-500">
                                    {criterion.description}
                                  </p>
                                )}

                                {/* Score */}
                                <ScoreInput
                                  id={`eval-score-${criterion.id}`}
                                  value={es?.scoreValue ?? ""}
                                  max={criterion.maxPoints}
                                  disabled={false}
                                  onChange={(v) => updateEvalScore(idx, "scoreValue", v)}
                                />

                                {/* Optional comment */}
                                <textarea
                                  id={`eval-comment-${criterion.id}`}
                                  rows={2}
                                  value={es?.comments || ""}
                                  onChange={(e) =>
                                    updateEvalScore(idx, "comments", e.target.value)
                                  }
                                  placeholder="Nhận xét (không bắt buộc)..."
                                  className="w-full px-3 py-2 rounded-lg text-xs text-white placeholder-slate-600
                                    bg-slate-800/50 border border-slate-700/50 resize-none
                                    focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25
                                    transition-all duration-200"
                                />
                              </div>
                            );
                          })}

                          {/* Score summary */}
                          {evalCriteria.length > 0 && (
                            <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
                              <div className="text-sm text-slate-400">
                                Tổng tiêu chí:{" "}
                                <span className="font-semibold text-white">
                                  {evalCriteria.length}
                                </span>
                              </div>
                              <button
                                type="submit"
                                id="eval-submit-btn"
                                disabled={evalSubmitting}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm
                                  bg-gradient-to-r from-orange-600 to-orange-500
                                  hover:from-orange-500 hover:to-amber-500
                                  shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35
                                  hover:scale-[1.02] active:scale-[0.98]
                                  disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100
                                  transition-all duration-200"
                              >
                                {evalSubmitting ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                                {evalSubmitting ? "Đang ghi điểm..." : "Gửi điểm chính thức"}
                              </button>
                            </div>
                          )}
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
