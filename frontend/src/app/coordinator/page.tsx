"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Users,
  Trophy,
  BarChart3,
  ChevronDown,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Shield,
  Clock,
  TrendingUp,
  Zap,
  Eye,
  FileText,
  ArrowRight,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/api";

/* ─── Type Definitions ─────────────────────────────────────────────────────── */

interface EventItem {
  id: string;
  name: string;
  term: string;
  year: number;
  status: string;
}

interface RoundItem {
  id: string;
  name: string;
  sequenceNumber: number;
  status: string;
  submissionDeadline: string;
  topNToProgress: number;
  _count?: { submissions: number; judges: number };
  criteria?: CriterionItem[];
}

interface CriterionItem {
  id: string;
  name: string;
  maxPoints: number;
  weight: number;
  isTechnical: boolean;
}

interface TeamItem {
  id: string;
  name: string;
  status: string;
  reasonBlocked?: string | null;
  track?: { name: string };
  members?: { user: { fullName: string; email: string }; isLeader: boolean }[];
  _count?: { members: number };
}

interface CalibrationAnalytics {
  icc: number | null;
  krippendorphAlpha: number | null;
  judgeScores: {
    judgeName: string;
    averageScore: number;
    stdDev: number;
    totalScores: number;
  }[];
  sampleCount: number;
}

type RoundStatusType =
  | "UPCOMING"
  | "SUBMISSION_OPEN"
  | "SUBMISSION_CLOSED"
  | "CALIBRATION"
  | "EVALUATION"
  | "COMPLETED";

/* ─── Constants ────────────────────────────────────────────────────────────── */

const ROUND_STATUS_FLOW: RoundStatusType[] = [
  "UPCOMING",
  "SUBMISSION_OPEN",
  "SUBMISSION_CLOSED",
  "CALIBRATION",
  "EVALUATION",
  "COMPLETED",
];

const STATUS_CONFIG: Record<
  RoundStatusType,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  UPCOMING: {
    label: "Sắp diễn ra",
    color: "text-slate-400",
    bg: "bg-slate-500/10 border-slate-500/20",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  SUBMISSION_OPEN: {
    label: "Đang mở nộp bài",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    icon: <FileText className="w-3.5 h-3.5" />,
  },
  SUBMISSION_CLOSED: {
    label: "Đã đóng nộp bài",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
    icon: <Shield className="w-3.5 h-3.5" />,
  },
  CALIBRATION: {
    label: "Đang chấm thử",
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
    icon: <BarChart3 className="w-3.5 h-3.5" />,
  },
  EVALUATION: {
    label: "Đang chấm điểm",
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
    icon: <Activity className="w-3.5 h-3.5" />,
  },
  COMPLETED: {
    label: "Hoàn thành",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
};

const TEAM_STATUS_BADGE: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  PENDING: {
    label: "Chờ duyệt",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
  },
  APPROVED: {
    label: "Đã duyệt",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  DISQUALIFIED: {
    label: "Đã loại",
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
  },
};

/* ─── Toast Component ──────────────────────────────────────────────────────── */

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-2xl backdrop-blur-md animate-slide-up ${
        type === "success"
          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          : "bg-red-500/10 border-red-500/20 text-red-400"
      }`}
    >
      {type === "success" ? (
        <CheckCircle className="w-5 h-5 flex-shrink-0" />
      ) : (
        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
      )}
      <span className="text-sm font-medium max-w-sm">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
        <XCircle className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ─── Disqualify Modal ─────────────────────────────────────────────────────── */

function DisqualifyModal({
  team,
  onClose,
  onConfirm,
}: {
  team: TeamItem;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 glass-panel-strong rounded-2xl p-6 border border-red-500/20 animate-slide-up">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Loại đội thi</h3>
            <p className="text-xs text-slate-400">
              Đội &quot;{team.name}&quot; sẽ bị loại khỏi giải đấu
            </p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
            Lý do loại đội (bắt buộc — ghi Audit Log)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Nhập lý do chi tiết để ghi nhận vào hệ thống kiểm toán..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 resize-none transition-all"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
          >
            Hủy bỏ
          </button>
          <button
            disabled={!reason.trim()}
            onClick={() => onConfirm(reason)}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-600 text-white transition-all shadow-lg shadow-red-500/10"
          >
            Xác nhận loại đội
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COORDINATOR PAGE
   ═══════════════════════════════════════════════════════════════════════════ */

export default function CoordinatorDashboard() {
  /* ── State ── */
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [rounds, setRounds] = useState<RoundItem[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [calibration, setCalibration] = useState<CalibrationAnalytics | null>(
    null
  );

  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingRounds, setLoadingRounds] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingCalibration, setLoadingCalibration] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [disqualifyTarget, setDisqualifyTarget] = useState<TeamItem | null>(
    null
  );

  // Active tab
  const [activeSection, setActiveSection] = useState<
    "rounds" | "teams" | "calibration"
  >("rounds");

  /* ── Fetch Events ── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithAuth<{ success: boolean; data: EventItem[] }>(
          "/events"
        );
        setEvents(res.data || []);
        if (res.data?.length) setSelectedEventId(res.data[0].id);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Lỗi tải sự kiện";
        setToast({ message: msg, type: "error" });
      } finally {
        setLoadingEvents(false);
      }
    })();
  }, []);

  /* ── Fetch Rounds when event changes ── */
  const fetchRounds = useCallback(async () => {
    if (!selectedEventId) return;
    setLoadingRounds(true);
    try {
      const res = await fetchWithAuth<{ success: boolean; data: RoundItem[] }>(
        `/rounds/event/${selectedEventId}`
      );
      setRounds(res.data || []);
      if (res.data?.length) setSelectedRoundId(res.data[0].id);
      else setSelectedRoundId("");
    } catch {
      setRounds([]);
    } finally {
      setLoadingRounds(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    fetchRounds();
  }, [fetchRounds]);

  /* ── Fetch Teams ── */
  const fetchTeams = useCallback(async () => {
    if (!selectedEventId) return;
    setLoadingTeams(true);
    try {
      // Try fetching teams for each track in the event
      // Since there's no direct "get all teams for event" API,
      // we'll use the event rounds to find tracks
      const res = await fetchWithAuth<{ success: boolean; data: TeamItem[] }>(
        `/teams?eventId=${selectedEventId}`
      );
      setTeams(res.data || []);
    } catch {
      // Fallback: try fetching all teams (if API supports)
      try {
        const res = await fetchWithAuth<{
          success: boolean;
          data: TeamItem[];
        }>("/teams");
        setTeams(res.data || []);
      } catch {
        setTeams([]);
      }
    } finally {
      setLoadingTeams(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    if (activeSection === "teams") fetchTeams();
  }, [activeSection, fetchTeams]);

  /* ── Fetch Calibration Analytics ── */
  const fetchCalibration = useCallback(async () => {
    if (!selectedRoundId) return;
    setLoadingCalibration(true);
    setCalibration(null);
    try {
      const res = await fetchWithAuth<{
        success: boolean;
        data: CalibrationAnalytics;
      }>(`/calibration/results/${selectedRoundId}/analytics`);
      setCalibration(res.data);
    } catch {
      setCalibration(null);
    } finally {
      setLoadingCalibration(false);
    }
  }, [selectedRoundId]);

  useEffect(() => {
    if (activeSection === "calibration" && selectedRoundId) fetchCalibration();
  }, [activeSection, selectedRoundId, fetchCalibration]);

  /* ── Actions ── */

  const handleStatusChange = async (
    roundId: string,
    newStatus: RoundStatusType
  ) => {
    setUpdatingStatus(true);
    try {
      await fetchWithAuth(`/rounds/${roundId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      setToast({
        message: `Đã chuyển trạng thái vòng đấu sang "${STATUS_CONFIG[newStatus].label}"`,
        type: "success",
      });
      fetchRounds();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Không thể cập nhật trạng thái";
      setToast({ message: msg, type: "error" });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleApproveTeam = async (teamId: string) => {
    try {
      await fetchWithAuth(`/teams/${teamId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "APPROVED" }),
      });
      setToast({ message: "Đã phê duyệt đội thi thành công!", type: "success" });
      fetchTeams();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Không thể phê duyệt đội";
      setToast({ message: msg, type: "error" });
    }
  };

  const handleDisqualifyTeam = async (teamId: string, reason: string) => {
    try {
      await fetchWithAuth(`/teams/${teamId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "DISQUALIFIED", reasonBlocked: reason }),
      });
      setToast({
        message: "Đã loại đội thi và ghi Audit Log thành công.",
        type: "success",
      });
      setDisqualifyTarget(null);
      fetchTeams();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Không thể loại đội thi";
      setToast({ message: msg, type: "error" });
    }
  };

  /* ── Derived ── */
  const selectedRound = rounds.find((r) => r.id === selectedRoundId);
  const pendingTeams = teams.filter((t) => t.status === "PENDING");
  const approvedTeams = teams.filter((t) => t.status === "APPROVED");
  const disqualifiedTeams = teams.filter((t) => t.status === "DISQUALIFIED");

  /* ═══════════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════════ */

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Disqualify Modal */}
      {disqualifyTarget && (
        <DisqualifyModal
          team={disqualifyTarget}
          onClose={() => setDisqualifyTarget(null)}
          onConfirm={(reason) =>
            handleDisqualifyTeam(disqualifyTarget.id, reason)
          }
        />
      )}

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs text-orange-400 font-semibold uppercase tracking-widest mb-1">
            Ban tổ chức
          </p>
          <h1 className="page-title">Bảng điều khiển Coordinator</h1>
          <p className="text-sm text-slate-400 mt-1">
            Quản lý vòng đấu, phê duyệt đội thi và giám sát hiệu chuẩn giám
            khảo
          </p>
        </div>

        {/* Event Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
            Sự kiện:
          </label>
          {loadingEvents ? (
            <div className="flex items-center gap-2 text-xs text-slate-500 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Đang tải...
            </div>
          ) : (
            <div className="relative">
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-slate-800 bg-slate-900/60 text-sm font-semibold text-white focus:outline-none focus:border-orange-500/40 cursor-pointer transition-all min-w-[220px]"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} ({ev.term} {ev.year})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={<Trophy className="w-5 h-5" />}
          label="Vòng đấu"
          value={rounds.length}
          accent="orange"
        />
        <SummaryCard
          icon={<Users className="w-5 h-5" />}
          label="Tổng đội thi"
          value={teams.length || "—"}
          accent="blue"
        />
        <SummaryCard
          icon={<Clock className="w-5 h-5" />}
          label="Chờ duyệt"
          value={pendingTeams.length}
          accent="yellow"
          highlight={pendingTeams.length > 0}
        />
        <SummaryCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Đã duyệt"
          value={approvedTeams.length}
          accent="emerald"
        />
      </div>

      {/* ── Section Tabs ── */}
      <div className="flex gap-1 p-1 rounded-xl bg-slate-900/40 border border-slate-800/50 w-fit">
        {(
          [
            { key: "rounds", label: "Quản lý Vòng đấu", icon: <Zap className="w-4 h-4" /> },
            { key: "teams", label: "Đội thi", icon: <Users className="w-4 h-4" /> },
            {
              key: "calibration",
              label: "Hiệu chuẩn GK",
              icon: <BarChart3 className="w-4 h-4" />,
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeSection === tab.key
                ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md shadow-orange-500/10"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
         SECTION 1: ROUND MANAGEMENT
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeSection === "rounds" && (
        <div className="space-y-4 animate-fade-in">
          {loadingRounds ? (
            <LoadingBox text="Đang tải danh sách vòng đấu..." />
          ) : rounds.length === 0 ? (
            <EmptyBox
              text="Chưa có vòng đấu nào cho sự kiện này"
              sub="Hãy tạo vòng đấu đầu tiên từ API hoặc giao diện quản lý."
            />
          ) : (
            <div className="grid gap-4">
              {rounds.map((round) => (
                <RoundCard
                  key={round.id}
                  round={round}
                  isSelected={round.id === selectedRoundId}
                  onSelect={() => setSelectedRoundId(round.id)}
                  onStatusChange={handleStatusChange}
                  updating={updatingStatus}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
         SECTION 2: TEAM MANAGEMENT
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeSection === "teams" && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-400" />
              Quản lý Đội thi
            </h2>
            <button
              onClick={fetchTeams}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Làm mới
            </button>
          </div>

          {loadingTeams ? (
            <LoadingBox text="Đang tải danh sách đội..." />
          ) : teams.length === 0 ? (
            <EmptyBox
              text="Chưa có đội thi nào"
              sub="Các đội sẽ xuất hiện khi sinh viên đăng ký và tạo đội."
            />
          ) : (
            <div className="space-y-6">
              {/* Pending Teams */}
              {pendingTeams.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-yellow-400 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Đang chờ duyệt ({pendingTeams.length})
                  </h3>
                  <div className="grid gap-3">
                    {pendingTeams.map((team) => (
                      <TeamCard
                        key={team.id}
                        team={team}
                        onApprove={() => handleApproveTeam(team.id)}
                        onDisqualify={() => setDisqualifyTarget(team)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Approved Teams */}
              {approvedTeams.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Đã phê duyệt ({approvedTeams.length})
                  </h3>
                  <div className="grid gap-3">
                    {approvedTeams.map((team) => (
                      <TeamCard
                        key={team.id}
                        team={team}
                        onDisqualify={() => setDisqualifyTarget(team)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Disqualified Teams */}
              {disqualifiedTeams.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Đã bị loại ({disqualifiedTeams.length})
                  </h3>
                  <div className="grid gap-3">
                    {disqualifiedTeams.map((team) => (
                      <TeamCard key={team.id} team={team} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
         SECTION 3: CALIBRATION ANALYTICS
         ═══════════════════════════════════════════════════════════════════════ */}
      {activeSection === "calibration" && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="section-title flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-400" />
              Chỉ số Hiệu chuẩn Giám khảo
            </h2>

            {/* Round selector for calibration */}
            {rounds.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Vòng:
                </label>
                <div className="relative">
                  <select
                    value={selectedRoundId}
                    onChange={(e) => setSelectedRoundId(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-slate-800 bg-slate-900/60 text-xs font-semibold text-white focus:outline-none focus:border-orange-500/40 cursor-pointer transition-all"
                  >
                    {rounds.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
                <button
                  onClick={fetchCalibration}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Tải lại
                </button>
              </div>
            )}
          </div>

          {loadingCalibration ? (
            <LoadingBox text="Đang phân tích dữ liệu hiệu chuẩn..." />
          ) : !calibration ? (
            <EmptyBox
              text="Chưa có dữ liệu hiệu chuẩn"
              sub="Dữ liệu sẽ xuất hiện khi giám khảo chấm thử dự án mẫu (Calibration)."
            />
          ) : (
            <div className="space-y-4">
              {/* ICC Warning Banner */}
              {calibration.icc !== null && calibration.icc < 0.7 && (
                <div className="flex items-start gap-3 p-4 rounded-2xl border border-red-500/20 bg-red-500/5 animate-slide-up">
                  <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-400">
                      ⚠️ Cảnh báo: Độ đồng thuận giữa các giám khảo đang ở
                      mức thấp (ICC &lt; 0.7)
                    </p>
                    <p className="text-xs text-red-400/70 mt-1 leading-relaxed">
                      Ban tổ chức cần họp thảo luận để thống nhất lại tiêu chí
                      chấm. Xem xét tổ chức thêm một vòng chấm thử (Calibration)
                      trước khi chuyển sang chấm điểm chính thức.
                    </p>
                  </div>
                </div>
              )}

              {/* Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                  label="ICC (Intraclass Correlation)"
                  value={
                    calibration.icc !== null
                      ? calibration.icc.toFixed(3)
                      : "N/A"
                  }
                  description="Hệ số tương quan nội lớp"
                  quality={getICCQuality(calibration.icc)}
                />
                <MetricCard
                  label="Krippendorff's Alpha"
                  value={
                    calibration.krippendorphAlpha !== null
                      ? calibration.krippendorphAlpha.toFixed(3)
                      : "N/A"
                  }
                  description="Chỉ số đồng thuận Krippendorff"
                  quality={getAlphaQuality(calibration.krippendorphAlpha)}
                />
                <MetricCard
                  label="Mẫu hiệu chuẩn"
                  value={calibration.sampleCount.toString()}
                  description="Số dự án mẫu đã chấm thử"
                  quality="info"
                />
              </div>

              {/* Judge Score Table */}
              {calibration.judgeScores.length > 0 && (
                <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-800/50">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Eye className="w-4 h-4 text-orange-400" />
                      Chi tiết điểm chấm thử từng Giám khảo
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-800/50">
                          <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Giám khảo
                          </th>
                          <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Điểm TB
                          </th>
                          <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Độ lệch chuẩn
                          </th>
                          <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Số lượt chấm
                          </th>
                          <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Mức độ lệch
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {calibration.judgeScores.map((judge, idx) => {
                          const avgAll =
                            calibration.judgeScores.reduce(
                              (sum, j) => sum + j.averageScore,
                              0
                            ) / calibration.judgeScores.length;
                          const deviation = Math.abs(
                            judge.averageScore - avgAll
                          );
                          const deviationLevel =
                            deviation > 2
                              ? "high"
                              : deviation > 1
                              ? "medium"
                              : "low";

                          return (
                            <tr
                              key={idx}
                              className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors"
                            >
                              <td className="px-5 py-3 font-medium text-white">
                                {judge.judgeName}
                              </td>
                              <td className="px-4 py-3 text-center font-mono text-orange-400 font-bold">
                                {judge.averageScore.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-center font-mono text-slate-300">
                                ±{judge.stdDev.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-center text-slate-400">
                                {judge.totalScores}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded-md text-2xs font-bold border ${
                                    deviationLevel === "high"
                                      ? "bg-red-500/10 border-red-500/20 text-red-400"
                                      : deviationLevel === "medium"
                                      ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                                      : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                  }`}
                                >
                                  {deviationLevel === "high"
                                    ? "Lệch cao"
                                    : deviationLevel === "medium"
                                    ? "Lệch nhẹ"
                                    : "Ổn định"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Summary Card ── */

function SummaryCard({
  icon,
  label,
  value,
  accent,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  accent: string;
  highlight?: boolean;
}) {
  const colors: Record<string, string> = {
    orange: "from-orange-500/20 to-orange-600/5 border-orange-500/15 text-orange-400",
    blue: "from-blue-500/20 to-blue-600/5 border-blue-500/15 text-blue-400",
    yellow: "from-yellow-500/20 to-yellow-600/5 border-yellow-500/15 text-yellow-400",
    emerald: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/15 text-emerald-400",
  };

  return (
    <div
      className={`glass-panel rounded-2xl p-5 border transition-all hover-scale ${
        highlight ? "ring-1 ring-yellow-500/30" : ""
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[accent]} border flex items-center justify-center mb-3`}
      >
        {icon}
      </div>
      <p className="text-2xl font-extrabold text-white">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5 font-medium">{label}</p>
    </div>
  );
}

/* ── Round Card ── */

function RoundCard({
  round,
  isSelected,
  onSelect,
  onStatusChange,
  updating,
}: {
  round: RoundItem;
  isSelected: boolean;
  onSelect: () => void;
  onStatusChange: (roundId: string, newStatus: RoundStatusType) => void;
  updating: boolean;
}) {
  const status = STATUS_CONFIG[round.status as RoundStatusType] || STATUS_CONFIG.UPCOMING;
  const currentIdx = ROUND_STATUS_FLOW.indexOf(round.status as RoundStatusType);
  const nextStatus =
    currentIdx < ROUND_STATUS_FLOW.length - 1
      ? ROUND_STATUS_FLOW[currentIdx + 1]
      : null;

  return (
    <div
      onClick={onSelect}
      className={`glass-panel rounded-2xl border p-5 cursor-pointer transition-all ${
        isSelected
          ? "border-orange-500/30 ring-1 ring-orange-500/10"
          : "border-slate-800 hover:border-slate-700"
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Round info */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/5 border border-orange-500/15 flex items-center justify-center text-orange-400 font-extrabold text-lg">
            {round.sequenceNumber}
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{round.name}</h3>
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              {/* Status badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-2xs font-bold border ${status.bg} ${status.color}`}
              >
                {status.icon}
                {status.label}
              </span>
              {/* Deadline */}
              <span className="text-2xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Deadline:{" "}
                {new Date(round.submissionDeadline).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {/* Top N */}
              <span className="text-2xs text-slate-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Top {round.topNToProgress} đi tiếp
              </span>
            </div>
          </div>
        </div>

        {/* Status Flow Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Status flow dots */}
          <div className="hidden lg:flex items-center gap-1">
            {ROUND_STATUS_FLOW.map((s, i) => (
              <React.Fragment key={s}>
                <div
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i <= currentIdx
                      ? "bg-orange-500 shadow-sm shadow-orange-500/30"
                      : "bg-slate-700"
                  }`}
                  title={STATUS_CONFIG[s].label}
                />
                {i < ROUND_STATUS_FLOW.length - 1 && (
                  <div
                    className={`w-4 h-0.5 ${
                      i < currentIdx ? "bg-orange-500/50" : "bg-slate-800"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Next Status Button */}
          {nextStatus && (
            <button
              disabled={updating}
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(round.id, nextStatus);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 disabled:text-slate-600 text-white transition-all shadow-lg shadow-orange-500/10"
            >
              {updating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5" />
              )}
              {STATUS_CONFIG[nextStatus].label}
            </button>
          )}

          {round.status === "COMPLETED" && (
            <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" />
              Đã khóa sổ
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Team Card ── */

function TeamCard({
  team,
  onApprove,
  onDisqualify,
}: {
  team: TeamItem;
  onApprove?: () => void;
  onDisqualify?: () => void;
}) {
  const badge = TEAM_STATUS_BADGE[team.status] || TEAM_STATUS_BADGE.PENDING;

  return (
    <div className="glass-panel rounded-xl border border-slate-800 p-4 hover:border-slate-700 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center justify-center text-white font-bold text-sm">
            {team.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">{team.name}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              {team.track && (
                <span className="text-2xs text-slate-500">
                  Track: {team.track.name}
                </span>
              )}
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-2xs font-bold border ${badge.bg} ${badge.color}`}
              >
                {badge.label}
              </span>
              {team._count?.members !== undefined && (
                <span className="text-2xs text-slate-500 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {team._count.members} thành viên
                </span>
              )}
            </div>
            {team.status === "DISQUALIFIED" && team.reasonBlocked && (
              <p className="text-xs text-red-400/80 mt-1 flex items-start gap-1.5">
                <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                Lý do: {team.reasonBlocked}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {onApprove && team.status === "PENDING" && (
            <button
              onClick={onApprove}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm shadow-emerald-500/10"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Phê duyệt
            </button>
          )}
          {onDisqualify && team.status !== "DISQUALIFIED" && (
            <button
              onClick={onDisqualify}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all"
            >
              <XCircle className="w-3.5 h-3.5" />
              Loại
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Metric Card (Calibration) ── */

function MetricCard({
  label,
  value,
  description,
  quality,
}: {
  label: string;
  value: string;
  description: string;
  quality: "good" | "fair" | "poor" | "info";
}) {
  const qualityStyles: Record<string, string> = {
    good: "text-emerald-400",
    fair: "text-yellow-400",
    poor: "text-red-400",
    info: "text-blue-400",
  };

  const qualityLabels: Record<string, string> = {
    good: "Tốt",
    fair: "Trung bình",
    poor: "Kém",
    info: "",
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 p-5">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
        {label}
      </p>
      <div className="flex items-end gap-2">
        <span className={`text-3xl font-extrabold ${qualityStyles[quality]}`}>
          {value}
        </span>
        {qualityLabels[quality] && (
          <span
            className={`text-xs font-bold mb-1 ${qualityStyles[quality]} opacity-70`}
          >
            ({qualityLabels[quality]})
          </span>
        )}
      </div>
      <p className="text-xs text-slate-400 mt-2">{description}</p>
    </div>
  );
}

/* ── Helper Components ── */

function LoadingBox({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-10 h-10 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  );
}

function EmptyBox({ text, sub }: { text: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
      <div className="w-14 h-14 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center justify-center mb-2">
        <FileText className="w-6 h-6 text-slate-600" />
      </div>
      <p className="text-sm font-bold text-slate-400">{text}</p>
      <p className="text-xs text-slate-500 max-w-sm">{sub}</p>
    </div>
  );
}

/* ── Helper Functions ── */

function getICCQuality(icc: number | null): "good" | "fair" | "poor" | "info" {
  if (icc === null) return "info";
  if (icc >= 0.75) return "good";
  if (icc >= 0.5) return "fair";
  return "poor";
}

function getAlphaQuality(
  alpha: number | null
): "good" | "fair" | "poor" | "info" {
  if (alpha === null) return "info";
  if (alpha >= 0.8) return "good";
  if (alpha >= 0.667) return "fair";
  return "poor";
}
