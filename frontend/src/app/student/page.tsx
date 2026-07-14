"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  | "UPCOMING"
  | "SUBMISSION_OPEN"
  | "SUBMISSION_CLOSED"
  | "CALIBRATION"
  | "EVALUATION"
  | "COMPLETED";

interface UserMe {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

interface TeamMember {
  id: string;
  userId: string;
  isLeader: boolean;
  user: { id: string; fullName: string; email: string };
}

interface TeamData {
  id: string;
  name: string;
  status: TeamStatus;
  reasonBlocked?: string;
  isLeader: boolean;
  members: TeamMember[];
  track?: {
    id: string;
    name: string;
    event?: { id: string; name: string };
  };
  invitations?: any[];
}

interface Round {
  id: string;
  name: string;
  sequenceNumber: number;
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
    UPCOMING: {
      label: "Sắp diễn ra",
      cls: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    },
    SUBMISSION_OPEN: {
      label: "Đang mở nộp bài",
      cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    },
    SUBMISSION_CLOSED: {
      label: "Đóng nộp bài",
      cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
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
  const { label, cls } = map[status] || { label: "Sắp diễn ra", cls: "bg-slate-500/15 text-slate-400 border-slate-500/30" };
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
  const [team, setTeam] = useState<TeamData | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [selectedRound, setSelectedRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [repoUrl, setRepoUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const toastCounter = useRef(0);

  // Team Creation & Members Management states
  const [events, setEvents] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [emailToAdd, setEmailToAdd] = useState("");
  const [submittingAddMember, setSubmittingAddMember] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);

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

  // ── Fetch user, team & rounds ──
  // Strategy:
  // 1. GET /auth/me -> get current user info
  // 2. GET /teams/my-team -> get team info (includes track.event.id)
  // 3. GET /rounds/event/:eventId -> get rounds for student's event
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Step 1: Get current user
      const meRes = await fetchWithAuth("/auth/me");
      const currentUser: UserMe = meRes.data?.user ?? meRes.user ?? meRes;
      setUser(currentUser);

      // Fetch pending invitations
      try {
        const invRes = await fetchWithAuth("/teams/invitations/my-invitations");
        const invList = invRes.data ?? invRes ?? [];
        setPendingInvitations(invList);
      } catch (e) {
        console.error("Failed to load user invitations:", e);
      }

      // Step 2: Get team membership
      let teamData: TeamData | null = null;
      let eventId: string | null = null;

      try {
        const teamsRes = await fetchWithAuth("/teams/my-team");
        const teamsList: TeamData[] = teamsRes.data ?? teamsRes;
        if (Array.isArray(teamsList) && teamsList.length > 0) {
          teamData = teamsList[0];
          eventId = teamData.track?.event?.id ?? null;
          setTeam(teamData);
        } else {
          setTeam(null);
        }
      } catch {
        setTeam(null);
      }

      // Fetch events & tracks if user has no team
      if (!teamData) {
        try {
          const eventsRes: any = await fetchWithAuth("/events");
          const eventsList = eventsRes.data || eventsRes || [];
          setEvents(eventsList);
          if (eventsList.length > 0) {
            const defaultEventId = eventsList[0].id;
            setSelectedEventId(defaultEventId);
            const tracksRes: any = await fetchWithAuth(`/tracks/event/${defaultEventId}`);
            const tracksList = tracksRes.data || tracksRes || [];
            setTracks(tracksList);
            if (tracksList.length > 0) {
              setSelectedTrackId(tracksList[0].id);
            }
          }
        } catch (e) {
          console.error("Error loading events for team creation:", e);
        }
      }

      // Step 3: Get rounds for the event
      if (eventId) {
        try {
          const roundsRes = await fetchWithAuth(`/rounds/event/${eventId}`);
          const roundsList: Round[] = roundsRes.data ?? roundsRes;

          // Enrich rounds with mySubmission if team exists
          if (teamData && Array.isArray(roundsList)) {
            const enriched = roundsList.map((r) => ({
              ...r,
              eventName: teamData!.track?.event?.name,
              // Backend's round includes submissions array — find team's submission
              mySubmission: (r as any).submissions?.find(
                (s: any) => s.teamId === teamData!.id
              ) ?? undefined,
            }));
            setRounds(enriched);
          } else {
            setRounds(Array.isArray(roundsList) ? roundsList : []);
          }
        } catch {
          setRounds([]);
        }
      } else {
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
    const token = localStorage.getItem("seal_hms_token");
    if (!token) {
      router.push("/auth/login");
      return;
    }
    const cached = localStorage.getItem("seal_hms_user");
    if (cached) {
      try {
        const u = JSON.parse(cached);
        setUser({ id: u.id, fullName: u.fullName ?? u.name, email: u.email, role: u.role });
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
    if (!selectedRound || !team) return;

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
          teamId: team.id,
          repoUrl: repoUrl.trim(),
          demoUrl: demoUrl.trim(),
        }),
      });
      addToast("success", "Nộp bài thành công! Ban tổ chức sẽ xem xét.");
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

  const handleEventChange = async (eventId: string) => {
    setSelectedEventId(eventId);
    setSelectedTrackId("");
    setTracks([]);
    if (!eventId) return;
    try {
      const tracksRes: any = await fetchWithAuth(`/tracks/event/${eventId}`);
      const tracksList = tracksRes.data || tracksRes || [];
      setTracks(tracksList);
      if (tracksList.length > 0) {
        setSelectedTrackId(tracksList[0].id);
      }
    } catch (err: any) {
      console.error("Failed to fetch tracks for event:", err);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      addToast("warning", "Vui lòng điền tên đội thi.");
      return;
    }
    if (!selectedTrackId) {
      addToast("warning", "Vui lòng chọn Track công nghệ.");
      return;
    }

    setCreatingTeam(true);
    try {
      await fetchWithAuth("/teams", {
        method: "POST",
        body: JSON.stringify({
          name: newTeamName.trim(),
          trackId: selectedTrackId,
        }),
      });
      addToast("success", "Tạo đội thi thành công! Hãy thêm thành viên.");
      setNewTeamName("");
      await loadData();
    } catch (err: any) {
      addToast("error", err?.message || "Tạo đội thi thất bại.");
    } finally {
      setCreatingTeam(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;
    if (!emailToAdd.trim()) {
      addToast("warning", "Vui lòng điền email của thành viên cần thêm.");
      return;
    }

    setSubmittingAddMember(true);
    try {
      // 1. Search for user by email to get their userId
      const userRes: any = await fetchWithAuth(`/users/search-by-email?email=${encodeURIComponent(emailToAdd.trim())}`);
      const userToRegister = userRes.data || userRes;
      if (!userToRegister || !userToRegister.id) {
        addToast("error", "Không tìm thấy thông tin tài khoản sinh viên.");
        setSubmittingAddMember(false);
        return;
      }

      // 2. Add to team (sends invitation)
      await fetchWithAuth(`/teams/${team.id}/members`, {
        method: "POST",
        body: JSON.stringify({
          userId: userToRegister.id,
        }),
      });

      addToast("success", `Đã gửi lời mời tham gia tới ${userToRegister.fullName}!`);
      setEmailToAdd("");
      await loadData();
    } catch (err: any) {
      addToast("error", err?.message || "Không thể thêm thành viên vào đội thi.");
    } finally {
      setSubmittingAddMember(false);
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!team) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa thành viên "${userName}" ra khỏi đội thi?`)) {
      return;
    }

    try {
      await fetchWithAuth(`/teams/${team.id}/members/${userId}`, {
        method: "DELETE",
      });
      addToast("success", `Đã xóa thành viên "${userName}" khỏi đội.`);
      await loadData();
    } catch (err: any) {
      addToast("error", err?.message || "Xóa thành viên thất bại.");
    }
  };

  const handleRespondInvitation = async (invitationId: string, action: "ACCEPT" | "REJECT", teamName: string) => {
    try {
      await fetchWithAuth(`/teams/invitations/${invitationId}/respond`, {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      addToast("success", `${action === "ACCEPT" ? "Đã đồng ý tham gia" : "Đã từ chối lời mời vào"} đội "${teamName}".`);
      await loadData();
    } catch (err: any) {
      addToast("error", err?.message || "Không thể xử lý lời mời.");
    }
  };

  const handleCancelInvitation = async (invitationId: string, userName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn hủy lời mời dành cho "${userName}"?`)) {
      return;
    }
    try {
      await fetchWithAuth(`/teams/invitations/${invitationId}`, {
        method: "DELETE",
      });
      addToast("success", `Đã hủy lời mời dành cho "${userName}".`);
      await loadData();
    } catch (err: any) {
      addToast("error", err?.message || "Hủy lời mời thất bại.");
    }
  };

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

  const isLeader = team?.isLeader ?? false;
  const isDisqualified = team?.status === "DISQUALIFIED";
  const blockReason = selectedRound ? getSubmitBlockReason(selectedRound) : null;
  const canSubmit = isLeader && !isDisqualified && !blockReason && team?.status === "APPROVED";

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
                {team?.reasonBlocked ||
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
            <Link
              href="/profile"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-orange-500/50 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-[10px] font-bold text-white">
                {user?.fullName?.[0]?.toUpperCase() || "S"}
              </div>
              <span className="text-sm text-slate-300 font-medium hover:text-orange-400 transition-colors">
                {user?.fullName || "Thí sinh"}
              </span>
            </Link>
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
        {/* ══ SECTION 0: Pending Invitations ══ */}
        {pendingInvitations.length > 0 && (
          <section className="animate-fade-in space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-400" />
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Lời mời vào đội thi ({pendingInvitations.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {pendingInvitations.map((inv) => (
                <div
                  key={inv.id}
                  className="rounded-2xl p-5 border border-orange-500/20 bg-orange-500/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  style={{
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white">
                      Lời mời gia nhập đội <span className="text-orange-400">"{inv.team.name}"</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Sự kiện: <span className="text-slate-300 font-semibold">{inv.team.track?.event?.name}</span> · Track: <span className="text-slate-300">{inv.team.track?.name}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Thành viên hiện tại: {inv.team.members?.map((m: any) => m.user?.fullName || m.fullName).join(", ") || "Chưa có"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleRespondInvitation(inv.id, "ACCEPT", inv.team.name)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-md shadow-orange-500/10"
                    >
                      Đồng ý
                    </button>
                    <button
                      onClick={() => handleRespondInvitation(inv.id, "REJECT", inv.team.name)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50 transition-all"
                    >
                      Từ chối
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ══ SECTION 1: Team Info ══ */}
        <section id="team">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Thông tin Đội thi
            </h2>
          </div>

          {!team ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
              {/* Left Column: Notification */}
              <div
                className="md:col-span-1 rounded-2xl p-6 border border-dashed border-slate-700/60 text-center flex flex-col items-center justify-center bg-white/[0.01]"
              >
                <Users className="w-12 h-12 text-slate-500 mb-3" />
                <p className="text-slate-300 font-semibold text-sm">Chưa thuộc đội thi nào</p>
                <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                  Bạn có thể lập đội mới ngay bên cạnh, trở thành nhóm trưởng và mời các thành viên khác tham gia. Hoặc chờ nhóm trưởng khác thêm bạn vào nhóm bằng Email.
                </p>
              </div>

              {/* Right Column: Creation Form */}
              <div
                className="md:col-span-2 rounded-2xl p-6 border border-white/[0.06] space-y-4"
                style={{
                  background: "rgba(15, 23, 42, 0.55)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
                }}
              >
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-orange-400" />
                  Đăng ký Đội thi & Track Công nghệ
                </h3>
                <p className="text-xs text-slate-400">
                  Hãy nhập tên nhóm và chọn Track công nghệ của sự kiện để bắt đầu hành trình Hackathon.
                </p>

                <form onSubmit={handleCreateTeam} className="space-y-4 pt-2">
                  {/* Tên Đội Thi */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                      Tên Đội Thi <span className="text-orange-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      placeholder="Nhập tên nhóm của bạn (ví dụ: Alpha Coders)..."
                      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 bg-slate-900 border border-slate-800 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Chọn Sự Kiện */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                        Sự Kiện
                      </label>
                      <div className="relative">
                        <select
                          value={selectedEventId}
                          onChange={(e) => handleEventChange(e.target.value)}
                          className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl text-sm text-white bg-slate-900 border border-slate-800 focus:outline-none focus:border-orange-500/50 cursor-pointer transition-all"
                        >
                          {events.map((ev) => (
                            <option key={ev.id} value={ev.id}>
                              {ev.name} ({ev.term} {ev.year})
                            </option>
                          ))}
                        </select>
                        <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none rotate-90" />
                      </div>
                    </div>

                    {/* Chọn Track */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                        Track Công Nghệ <span className="text-orange-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={selectedTrackId}
                          onChange={(e) => setSelectedTrackId(e.target.value)}
                          className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl text-sm text-white bg-slate-900 border border-slate-800 focus:outline-none focus:border-orange-500/50 cursor-pointer transition-all"
                        >
                          {tracks.length === 0 ? (
                            <option value="">Không có track nào</option>
                          ) : (
                            tracks.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))
                          )}
                        </select>
                        <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none rotate-90" />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={creatingTeam || tracks.length === 0}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 disabled:text-slate-600 text-white transition-all shadow-lg shadow-orange-500/10 mt-2"
                  >
                    {creatingTeam ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trophy className="w-4 h-4" />
                    )}
                    {creatingTeam ? "Đang khởi tạo nhóm..." : "Khởi tạo Đội Thi & Đăng Ký"}
                  </button>
                </form>
              </div>
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
                      {team.track && (
                        <span className="text-xs text-slate-500">
                          Track: {team.track.name}
                        </span>
                      )}
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
                          {m.user.fullName?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-white font-medium truncate">
                            {m.user.fullName}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{m.user.email}</p>
                        </div>
                        {m.isLeader ? (
                          <Star className="w-3.5 h-3.5 text-orange-400 ml-auto flex-shrink-0" />
                        ) : (
                          isLeader && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(m.user.id, m.user.fullName)}
                              className="ml-auto p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all flex-shrink-0"
                              title="Xóa thành viên khỏi nhóm"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )
                        )}
                      </div>
                    ))}
                    {isLeader && team.invitations && team.invitations.map((inv: any) => (
                      <div
                        key={inv.id}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/15 border border-dashed border-slate-700/40 opacity-75 animate-fade-in"
                      >
                        <div className="w-7 h-7 rounded-full bg-slate-850 border border-slate-750 flex items-center justify-center text-xs font-medium text-slate-500 flex-shrink-0">
                          {inv.user.fullName?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-slate-300 font-medium truncate">
                            {inv.user.fullName}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {inv.user.email} <span className="text-amber-500/80 font-normal ml-1">(Đang chờ...)</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCancelInvitation(inv.id, inv.user.fullName)}
                          className="ml-auto p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all flex-shrink-0"
                          title="Hủy lời mời"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add member form if leader */}
                  {isLeader && (
                    <div className="mt-5 pt-5 border-t border-white/[0.05] animate-fade-in">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                        Thêm thành viên mới
                      </p>
                      <form onSubmit={handleAddMember} className="flex gap-2 max-w-md">
                        <input
                          type="email"
                          value={emailToAdd}
                          onChange={(e) => setEmailToAdd(e.target.value)}
                          placeholder="Nhập email của sinh viên cần thêm (ví dụ: student2@fpt.edu.vn)..."
                          className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 bg-slate-900 border border-slate-800 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all"
                        />
                        <button
                          type="submit"
                          disabled={submittingAddMember}
                          className="px-4 py-2.5 rounded-xl font-bold bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-sm transition-all flex items-center gap-1.5 flex-shrink-0"
                        >
                          {submittingAddMember ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Users className="w-4 h-4" />
                          )}
                          Thêm
                        </button>
                      </form>
                      <p className="text-[11px] text-slate-500 mt-2">
                        * Sinh viên được mời cần đăng ký tài khoản trên hệ thống trước khi có thể thêm vào nhóm.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ══ SECTION 2: Rounds & Submission ══ */}
        <section id="submissions">
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
                {!team
                  ? "Bạn chưa thuộc đội thi nào nên không thể xem vòng thi."
                  : "Ban tổ chức chưa tạo vòng thi cho sự kiện này."}
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
                      {round.sequenceNumber}
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

                    {/* ── Pending approval: Read-only note ── */}
                    {team?.status === "PENDING" && !isDisqualified && (
                      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/25 text-amber-300 text-sm">
                        <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>
                          Đội thi đang chờ Ban tổ chức phê duyệt. Bạn chỉ có thể nộp bài sau khi đội được duyệt thành công.
                        </span>
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
