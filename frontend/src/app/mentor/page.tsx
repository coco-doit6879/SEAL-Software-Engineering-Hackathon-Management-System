"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Users,
  Star,
  Github,
  Globe,
  Loader2,
  RefreshCw,
  Clock,
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AuthGuard from "@/components/layout/AuthGuard";

// ─── Types ───────────────────────────────────────────────────────────────────
interface TeamMember {
  id: string;
  userId: string;
  isLeader: boolean;
  user: { id: string; fullName: string; email: string };
}

interface Submission {
  id: string;
  roundId: string;
  round: { id: string; name: string; sequenceNumber: number };
  repoUrl: string;
  demoUrl: string;
  documentUrl?: string;
  submittedAt: string;
  isDisqualified: boolean;
  disqualificationReason?: string;
}

interface Team {
  id: string;
  name: string;
  status: "PENDING" | "APPROVED" | "DISQUALIFIED";
  members: TeamMember[];
  submissions: Submission[];
}

interface Track {
  id: string;
  name: string;
  description?: string;
  event: { id: string; name: string; term: string; year: number };
  teams: Team[];
}

export default function MentorDashboard() {
  const router = useRouter();

  // ── State ──
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Submission scores tracking
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null);
  const [subScores, setSubScores] = useState<any[]>([]);
  const [loadingScores, setLoadingScores] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth("/tracks/mentor/my-tracks");
      const data: Track[] = res.data ?? res;
      setTracks(data);

      if (data.length > 0) {
        // Keep selection if exists, else select first
        setSelectedTrack((prev) => {
          const match = data.find((t) => t.id === prev?.id);
          return match || data[0];
        });
      } else {
        setSelectedTrack(null);
        setSelectedTeam(null);
      }
    } catch (err: any) {
      setError(err?.message || "Đã xảy ra lỗi khi tải thông tin Tracks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update selected team if track updates
  useEffect(() => {
    if (selectedTrack) {
      if (selectedTrack.teams.length > 0) {
        setSelectedTeam((prev) => {
          const match = selectedTrack.teams.find((t) => t.id === prev?.id);
          return match || selectedTrack.teams[0];
        });
      } else {
        setSelectedTeam(null);
      }
    } else {
      setSelectedTeam(null);
    }
  }, [selectedTrack]);

  // Reset expanded submission when selected team changes
  useEffect(() => {
    setExpandedSubId(null);
    setSubScores([]);
  }, [selectedTeam]);

  const fetchSubmissionScores = useCallback(async (subId: string) => {
    setLoadingScores(true);
    setSubScores([]);
    try {
      const res = await fetchWithAuth(`/scores/submission/${subId}`);
      setSubScores(res.data || []);
    } catch (err: any) {
      console.error("Failed to fetch submission scores:", err);
      setSubScores([]);
    } finally {
      setLoadingScores(false);
    }
  }, []);

  const handleToggleSubmissionDetails = (subId: string) => {
    if (expandedSubId === subId) {
      setExpandedSubId(null);
      setSubScores([]);
    } else {
      setExpandedSubId(subId);
      fetchSubmissionScores(subId);
    }
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Cố vấn Học thuật (Mentor)
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Theo dõi tiến độ, danh sách đội thi và bài nộp trong các Track được phân công.
              </p>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-all font-medium text-sm self-start sm:self-auto disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Tải lại
            </button>
          </div>

          {loading && tracks.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
              <p className="text-sm text-slate-400">Đang tải danh sách Track cố vấn...</p>
            </div>
          ) : error ? (
            <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
              <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <p className="text-red-300 font-semibold">{error}</p>
              <button
                onClick={loadData}
                className="mt-4 px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 hover:bg-red-500/30 text-sm font-medium transition-all"
              >
                Thử lại
              </button>
            </div>
          ) : tracks.length === 0 ? (
            <div className="p-10 rounded-2xl border border-dashed border-slate-800 text-center bg-white/[0.01]">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 font-medium text-lg">Chưa có Track cố vấn nào</p>
              <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
                Tài khoản của bạn chưa được gán cố vấn cho bất kỳ Track nào của cuộc thi. Vui lòng liên hệ Ban tổ chức để được phân công.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Track Selector & Teams List */}
              <div className="lg:col-span-4 space-y-6">
                {/* Track select card */}
                <div className="glass-panel p-5 rounded-2xl border border-slate-800">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Chọn Track Cố vấn
                  </label>
                  <div className="relative">
                    <select
                      value={selectedTrack?.id || ""}
                      onChange={(e) => {
                        const match = tracks.find((t) => t.id === e.target.value);
                        if (match) setSelectedTrack(match);
                      }}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white font-semibold text-sm focus:border-orange-500 focus:outline-none appearance-none"
                    >
                      {tracks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.event.name})
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500">
                      ▼
                    </div>
                  </div>

                  {selectedTrack?.description && (
                    <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                      {selectedTrack.description}
                    </p>
                  )}
                </div>

                {/* Teams List card */}
                <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
                  <div className="p-5 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Users size={16} className="text-orange-400" />
                      Danh sách Đội thi ({selectedTrack?.teams.length || 0})
                    </h2>
                  </div>

                  <div className="divide-y divide-white/5 max-h-[450px] overflow-y-auto">
                    {selectedTrack?.teams.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-sm">
                        Chưa có đội thi nào trong Track này.
                      </div>
                    ) : (
                      selectedTrack?.teams.map((team) => {
                        const isSel = selectedTeam?.id === team.id;
                        const submissionsCount = team.submissions.length;

                        return (
                          <button
                            key={team.id}
                            onClick={() => setSelectedTeam(team)}
                            className={`w-full text-left p-4 hover:bg-white/[0.02] transition-all flex items-center justify-between gap-3 ${
                              isSel ? "bg-orange-500/5 text-orange-400 font-semibold" : "text-slate-300"
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="text-sm truncate">{team.name}</p>
                              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                <span>{team.members.length} thành viên</span>
                                <span>·</span>
                                <span className={submissionsCount > 0 ? "text-emerald-500" : "text-slate-500"}>
                                  {submissionsCount} bài nộp
                                </span>
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              {team.status === "APPROVED" ? (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 block" title="Đã duyệt" />
                              ) : team.status === "DISQUALIFIED" ? (
                                <span className="w-2 h-2 rounded-full bg-red-500 block" title="Bị loại" />
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-amber-500 block" title="Chờ duyệt" />
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Selected Team Details */}
              <div className="lg:col-span-8">
                {selectedTeam ? (
                  <div className="space-y-6">
                    {/* Team Identity card */}
                    <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-xl text-orange-400">
                          🏆
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            {selectedTeam.name}
                          </h2>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            {selectedTeam.status === "APPROVED" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Đã duyệt (Active)
                              </span>
                            ) : selectedTeam.status === "DISQUALIFIED" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                Bị loại (Disqualified)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                Chờ duyệt (Pending)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Team Members card */}
                    <div className="glass-panel p-6 rounded-2xl border border-slate-800">
                      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                        Thành viên Nhóm
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedTeam.members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 border border-slate-800"
                          >
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                              {member.user.fullName?.[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {member.user.fullName}
                              </p>
                              <p className="text-xs text-slate-500 truncate">
                                {member.user.email}
                              </p>
                            </div>
                            {member.isLeader && (
                              <span className="ml-auto inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                <Star size={10} className="fill-current" />
                                Leader
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Submissions card */}
                    <div className="glass-panel p-6 rounded-2xl border border-slate-800">
                      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <BookOpen size={16} className="text-orange-400" />
                        Danh sách Bài nộp ({selectedTeam.submissions.length})
                      </h3>

                      {selectedTeam.submissions.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-sm">
                          Đội này chưa nộp bài giải pháp cho vòng thi nào.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {selectedTeam.submissions.map((sub) => (
                            <div
                              key={sub.id}
                              className={`rounded-xl border p-4 transition-all ${
                                sub.isDisqualified
                                  ? "border-red-500/20 bg-red-500/5"
                                  : "border-slate-800 bg-slate-900/50 hover:bg-slate-900"
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300 flex items-center justify-center">
                                    {sub.round.sequenceNumber}
                                  </span>
                                  <span className="text-sm font-bold text-white">
                                    {sub.round.name}
                                  </span>
                                  {sub.isDisqualified ? (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                      Bài thi bị hủy
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                      Hợp lệ
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <Clock size={12} />
                                  Nộp lúc: {new Date(sub.submittedAt).toLocaleString("vi-VN")}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                <a
                                  href={sub.repoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white text-xs transition-all"
                                >
                                  <Github size={16} className="text-slate-400" />
                                  <span className="truncate flex-1 font-mono">{sub.repoUrl}</span>
                                  <ExternalLink size={12} className="opacity-65" />
                                </a>
                                <a
                                  href={sub.demoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white text-xs transition-all"
                                >
                                  <Globe size={16} className="text-slate-400" />
                                  <span className="truncate flex-1 font-mono">{sub.demoUrl}</span>
                                  <ExternalLink size={12} className="opacity-65" />
                                </a>
                              </div>

                              {sub.isDisqualified && sub.disqualificationReason && (
                                <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                                  <strong>Lý do loại bài thi: </strong>
                                  {sub.disqualificationReason}
                                </div>
                              )}

                              {/* Judge Scores & Comments Toggle */}
                              {!sub.isDisqualified && (
                                <>
                                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-2xs text-slate-500">Xem nhận xét và điểm số của Giám khảo</span>
                                    <button
                                      onClick={() => handleToggleSubmissionDetails(sub.id)}
                                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                                    >
                                      {expandedSubId === sub.id ? "Thu gọn" : "Xem chi tiết điểm"}
                                    </button>
                                  </div>

                                  {expandedSubId === sub.id && (
                                    <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-4">
                                      {loadingScores ? (
                                        <div className="flex items-center justify-center gap-2 py-4">
                                          <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
                                          <span className="text-xs text-slate-500">Đang tải điểm số từ Giám khảo...</span>
                                        </div>
                                      ) : subScores.length === 0 ? (
                                        <p className="text-xs text-slate-500 italic text-center py-2">
                                          Chưa có điểm hoặc nhận xét nào từ Giám khảo.
                                        </p>
                                      ) : (
                                        <div className="space-y-4 animate-fade-in">
                                          {Object.entries(
                                            subScores.reduce((acc, score) => {
                                              const judgeName = score.judge.fullName;
                                              if (!acc[judgeName]) acc[judgeName] = [];
                                              acc[judgeName].push(score);
                                              return acc;
                                            }, {} as Record<string, any[]>)
                                          ).map(([judgeName, scoresVal], idx) => {
                                            const scores = scoresVal as any[];
                                            return (
                                              <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-900 space-y-3">
                                                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                                                  <span className="text-xs font-bold text-slate-300">Giám khảo: {judgeName}</span>
                                                </div>
                                                <div className="space-y-2">
                                                  {scores.map((score, sIdx) => (
                                                    <div key={sIdx} className="text-xs space-y-1">
                                                      <div className="flex items-center justify-between">
                                                        <span className="text-slate-400 font-medium">{score.criterion.name}:</span>
                                                        <span className="font-bold text-orange-400">
                                                          {score.scoreValue} / {score.criterion.maxPoints} đ
                                                        </span>
                                                      </div>
                                                      {score.comments && (
                                                        <p className="text-2xs text-slate-500 italic leading-relaxed pl-2 border-l border-orange-500/30 mt-0.5">
                                                          &ldquo;{score.comments}&rdquo;
                                                        </p>
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center gap-3 border border-dashed border-slate-800 rounded-2xl bg-white/[0.01]">
                    <Users className="w-10 h-10 text-slate-600" />
                    <p className="text-sm text-slate-500">
                      Chọn một đội thi ở danh sách bên trái để xem thông tin chi tiết.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
