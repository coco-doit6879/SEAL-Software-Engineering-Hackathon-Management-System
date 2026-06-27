"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Star,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  Clock,
  Shield,
  BarChart3,
  FileText,
  Github,
  Globe,
  Link as LinkIcon,
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

interface CriterionItem {
  id: string;
  name: string;
  maxPoints: number;
  weight: number;
  isTechnical: boolean;
  description?: string;
}

interface RoundItem {
  id: string;
  name: string;
  sequenceNumber: number;
  status: string;
  submissionDeadline: string;
  topNToProgress: number;
  criteria: CriterionItem[];
}

interface CalibrationSample {
  id: string;
  title: string;
  description: string;
  repoUrl: string;
  demoUrl?: string;
  documentUrl?: string;
}

interface SubmissionItem {
  id: string;
  repoUrl: string;
  demoUrl?: string;
  documentUrl?: string;
  isDisqualified: boolean;
  team: {
    id: string;
    name: string;
  };
}

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

/* ─── Grading Form Component ───────────────────────────────────────────────── */

function GradingForm({
  criteria,
  onSubmit,
  isSubmitting,
  disabledMessage,
}: {
  criteria: CriterionItem[];
  onSubmit: (scores: { criterionId: string; scoreValue: number; comments: string }[]) => void;
  isSubmitting: boolean;
  disabledMessage?: string;
}) {
  const [scores, setScores] = useState<
    Record<string, { scoreValue: number | ""; comments: string }>
  >(() => {
    const initial: Record<string, { scoreValue: number | ""; comments: string }> = {};
    criteria.forEach((c) => {
      initial[c.id] = { scoreValue: "", comments: "" };
    });
    return initial;
  });

  const handleScoreChange = (criterionId: string, value: string, maxPoints: number) => {
    if (value === "") {
      setScores((prev) => ({ ...prev, [criterionId]: { ...prev[criterionId], scoreValue: "" } }));
      return;
    }
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0 && num <= maxPoints) {
      setScores((prev) => ({ ...prev, [criterionId]: { ...prev[criterionId], scoreValue: num } }));
    }
  };

  const handleCommentChange = (criterionId: string, comments: string) => {
    setScores((prev) => ({ ...prev, [criterionId]: { ...prev[criterionId], comments } }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabledMessage) return;

    // Validate
    const payload: { criterionId: string; scoreValue: number; comments: string }[] = [];
    for (const c of criteria) {
      const s = scores[c.id];
      if (s.scoreValue === "" || s.scoreValue === undefined) {
        alert(`Vui lòng nhập điểm cho tiêu chí: ${c.name}`);
        return;
      }
      if (!s.comments.trim()) {
        alert(`Vui lòng nhập nhận xét cho tiêu chí: ${c.name}`);
        return;
      }
      payload.push({
        criterionId: c.id,
        scoreValue: s.scoreValue as number,
        comments: s.comments,
      });
    }

    onSubmit(payload);
  };

  const isDisabled = !!disabledMessage || isSubmitting;

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      {disabledMessage && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-semibold mb-4">
          <Shield className="w-4 h-4" />
          {disabledMessage}
        </div>
      )}

      {criteria.map((c) => (
        <div key={c.id} className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                {c.name}
                {c.isTechnical && (
                  <span className="px-2 py-0.5 rounded text-2xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Kỹ thuật
                  </span>
                )}
              </h4>
              {c.description && <p className="text-xs text-slate-400 mt-1">{c.description}</p>}
              <p className="text-xs text-orange-400 mt-1 font-medium">
                Trọng số: {(c.weight * 100).toFixed(0)}% • Tối đa: {c.maxPoints}đ
              </p>
            </div>
            <div className="w-24 flex-shrink-0">
              <label className="block text-2xs font-bold text-slate-500 uppercase mb-1">Điểm</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max={c.maxPoints}
                disabled={isDisabled}
                value={scores[c.id]?.scoreValue}
                onChange={(e) => handleScoreChange(c.id, e.target.value, c.maxPoints)}
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-800/50 text-white font-mono font-bold text-center focus:outline-none focus:border-orange-500/50 disabled:opacity-50"
                placeholder="0.0"
              />
            </div>
          </div>
          <div>
            <label className="block text-2xs font-bold text-slate-500 uppercase mb-1">Nhận xét (Bắt buộc)</label>
            <textarea
              disabled={isDisabled}
              value={scores[c.id]?.comments}
              onChange={(e) => handleCommentChange(c.id, e.target.value)}
              placeholder="Nhập nhận xét chi tiết để biện luận cho mức điểm..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-800/50 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 resize-none disabled:opacity-50 transition-colors"
            />
          </div>
        </div>
      ))}

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isDisabled}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Đang gửi...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Gửi Điểm Đánh Giá
            </>
          )}
        </button>
      </div>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN JUDGE DASHBOARD PAGE
   ═══════════════════════════════════════════════════════════════════════════ */

export default function JudgeDashboard() {
  /* ── State ── */
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [rounds, setRounds] = useState<RoundItem[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState("");

  const [samples, setSamples] = useState<CalibrationSample[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);

  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingRounds, setLoadingRounds] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  /* ── Fetch Events ── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithAuth<{ success: boolean; data: EventItem[] }>("/events");
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

  /* ── Fetch Rounds ── */
  useEffect(() => {
    const fetchRounds = async () => {
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
    };
    fetchRounds();
  }, [selectedEventId]);

  /* ── Fetch Items (Samples or Submissions) based on Round Status ── */
  const selectedRound = rounds.find((r) => r.id === selectedRoundId);

  const fetchItems = useCallback(async () => {
    if (!selectedRound) return;
    setLoadingItems(true);
    setSamples([]);
    setSubmissions([]);
    setExpandedItemId(null);

    try {
      if (selectedRound.status === "CALIBRATION") {
        const res = await fetchWithAuth<{ success: boolean; data: CalibrationSample[] }>(
          `/calibration/samples/round/${selectedRound.id}`
        );
        setSamples(res.data || []);
      } else if (selectedRound.status === "EVALUATION" || selectedRound.status === "COMPLETED") {
        const res = await fetchWithAuth<{ success: boolean; data: SubmissionItem[] }>(
          `/submissions/round/${selectedRound.id}`
        );
        setSubmissions(res.data || []);
      }
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoadingItems(false);
    }
  }, [selectedRound]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  /* ── Submit Score ── */
  const handleSubmitCalibration = async (
    sampleId: string,
    scores: { criterionId: string; scoreValue: number; comments: string }[]
  ) => {
    setSubmittingId(sampleId);
    try {
      await fetchWithAuth(`/calibration/samples/${sampleId}/scores`, {
        method: "POST",
        body: JSON.stringify({ scores }),
      });
      setToast({ message: "Gửi điểm chấm thử thành công!", type: "success" });
      setExpandedItemId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi gửi điểm";
      setToast({ message: msg, type: "error" });
    } finally {
      setSubmittingId(null);
    }
  };

  const handleSubmitEvaluation = async (
    submissionId: string,
    scores: { criterionId: string; scoreValue: number; comments: string }[]
  ) => {
    setSubmittingId(submissionId);
    try {
      await fetchWithAuth(`/scores/submission/${submissionId}`, {
        method: "POST",
        body: JSON.stringify({ scores }),
      });
      setToast({ message: "Gửi điểm chính thức thành công!", type: "success" });
      setExpandedItemId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi gửi điểm";
      setToast({ message: msg, type: "error" });
    } finally {
      setSubmittingId(null);
    }
  };

  /* ── Determine view state ── */
  const isCalibration = selectedRound?.status === "CALIBRATION";
  const isEvaluation = selectedRound?.status === "EVALUATION";
  const isLocked = selectedRound
    ? ["UPCOMING", "SUBMISSION_OPEN", "SUBMISSION_CLOSED", "COMPLETED"].includes(selectedRound.status)
    : false;

  let disabledMessage = "";
  if (selectedRound?.status === "COMPLETED") {
    disabledMessage = "Vòng thi đã kết thúc. Bảng điểm đã được khóa.";
  } else if (isLocked && selectedRound?.status !== "COMPLETED") {
    disabledMessage = "Vòng thi chưa đến thời gian chấm điểm.";
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════════ */

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs text-orange-400 font-semibold uppercase tracking-widest mb-1">
            Chuyên môn
          </p>
          <h1 className="page-title flex items-center gap-2">
            <Star className="w-8 h-8 text-orange-500" />
            Bảng Chấm Điểm
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Thực hiện chấm thử (hiệu chuẩn) và chấm điểm chính thức các đội thi.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Event Selector */}
          {!loadingEvents && events.length > 0 && (
            <div className="relative">
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-slate-800 bg-slate-900/60 text-sm font-semibold text-white focus:outline-none focus:border-orange-500/40 cursor-pointer"
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

          {/* Round Selector */}
          {!loadingRounds && rounds.length > 0 && (
            <div className="relative">
              <select
                value={selectedRoundId}
                onChange={(e) => setSelectedRoundId(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-slate-800 bg-slate-900/60 text-sm font-semibold text-white focus:outline-none focus:border-orange-500/40 cursor-pointer"
              >
                {rounds.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {/* ── Status Banner ── */}
      {selectedRound && (
        <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isCalibration
                  ? "bg-purple-500/10 border border-purple-500/20 text-purple-400"
                  : isEvaluation
                  ? "bg-orange-500/10 border border-orange-500/20 text-orange-400"
                  : "bg-slate-500/10 border border-slate-500/20 text-slate-400"
              }`}
            >
              {isCalibration ? <BarChart3 className="w-5 h-5" /> : isEvaluation ? <Activity className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                Trạng thái vòng đấu
              </p>
              <p
                className={`text-sm font-bold ${
                  isCalibration ? "text-purple-400" : isEvaluation ? "text-orange-400" : "text-slate-300"
                }`}
              >
                {isCalibration
                  ? "GIAI ĐOẠN CHẤM THỬ (CALIBRATION)"
                  : isEvaluation
                  ? "GIAI ĐOẠN CHẤM ĐIỂM CHÍNH THỨC"
                  : disabledMessage}
              </p>
            </div>
          </div>
          {selectedRound.criteria && (
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                Tiêu chí
              </p>
              <p className="text-sm font-bold text-white">
                {selectedRound.criteria.length} tiêu chí chấm
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Main Content Area ── */}
      {loadingItems || loadingRounds ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400">Đang tải dữ liệu chấm điểm...</p>
        </div>
      ) : !selectedRound ? (
        <div className="glass-panel p-10 rounded-2xl border border-slate-800 text-center">
          <p className="text-slate-400">Vui lòng chọn một sự kiện và vòng đấu.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* CALIBRATION PHASE */}
          {isCalibration && (
            <>
              {samples.length === 0 ? (
                <div className="glass-panel p-10 rounded-2xl border border-slate-800 text-center">
                  <p className="text-slate-400">Không có dự án mẫu nào để chấm thử.</p>
                </div>
              ) : (
                samples.map((sample) => (
                  <div key={sample.id} className="glass-panel rounded-2xl border border-slate-800 overflow-hidden transition-all">
                    <div
                      className="p-5 cursor-pointer hover:bg-slate-800/30 transition-colors"
                      onClick={() => setExpandedItemId(expandedItemId === sample.id ? null : sample.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                            <BarChart3 className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="px-2 py-0.5 rounded text-2xs font-bold bg-purple-500/20 text-purple-300 uppercase tracking-wider mb-1 inline-block">
                              Dự án Mẫu
                            </span>
                            <h3 className="text-lg font-bold text-white">{sample.title}</h3>
                            <p className="text-sm text-slate-400 mt-0.5 line-clamp-1">{sample.description}</p>
                          </div>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 text-slate-500 transition-transform ${
                            expandedItemId === sample.id ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </div>

                    {expandedItemId === sample.id && (
                      <div className="p-5 border-t border-slate-800/50 bg-slate-900/30">
                        {/* Links */}
                        <div className="flex flex-wrap gap-3 mb-6">
                          <a
                            href={sample.repoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-sm font-medium text-white transition-colors"
                          >
                            <Github className="w-4 h-4" /> Source Code
                          </a>
                          {sample.demoUrl && (
                            <a
                              href={sample.demoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-sm font-medium text-white transition-colors"
                            >
                              <Globe className="w-4 h-4" /> Live Demo
                            </a>
                          )}
                          {sample.documentUrl && (
                            <a
                              href={sample.documentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-sm font-medium text-white transition-colors"
                            >
                              <FileText className="w-4 h-4" /> Tài liệu
                            </a>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Phiếu Chấm Thử</h4>
                        <GradingForm
                          criteria={selectedRound.criteria}
                          onSubmit={(scores) => handleSubmitCalibration(sample.id, scores)}
                          isSubmitting={submittingId === sample.id}
                        />
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          )}

          {/* EVALUATION PHASE (OR COMPLETED) */}
          {(isEvaluation || isLocked) && !isCalibration && (
            <>
              {submissions.length === 0 ? (
                <div className="glass-panel p-10 rounded-2xl border border-slate-800 text-center">
                  <p className="text-slate-400">Không có bài nộp nào trong vòng này.</p>
                </div>
              ) : (
                submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className={`glass-panel rounded-2xl border overflow-hidden transition-all ${
                      sub.isDisqualified ? "border-red-500/30 opacity-70" : "border-slate-800"
                    }`}
                  >
                    <div
                      className={`p-5 cursor-pointer hover:bg-slate-800/30 transition-colors ${
                        sub.isDisqualified ? "bg-red-500/5 hover:bg-red-500/10" : ""
                      }`}
                      onClick={() => setExpandedItemId(expandedItemId === sub.id ? null : sub.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${
                              sub.isDisqualified
                                ? "bg-red-500/10 border border-red-500/20 text-red-400"
                                : "bg-orange-500/10 border border-orange-500/20 text-orange-400"
                            }`}
                          >
                            {sub.team.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="text-lg font-bold text-white">Đội {sub.team.name}</h3>
                              {sub.isDisqualified && (
                                <span className="px-2 py-0.5 rounded text-2xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                                  Bị Loại
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-400 flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Github className="w-3.5 h-3.5" /> Có Source
                              </span>
                              {sub.demoUrl && (
                                <span className="flex items-center gap-1 text-emerald-400">
                                  <Globe className="w-3.5 h-3.5" /> Có Demo
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 text-slate-500 transition-transform ${
                            expandedItemId === sub.id ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </div>

                    {expandedItemId === sub.id && (
                      <div className="p-5 border-t border-slate-800/50 bg-slate-900/30">
                        {/* Links */}
                        <div className="flex flex-wrap gap-3 mb-6">
                          <a
                            href={sub.repoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-sm font-medium text-white transition-colors"
                          >
                            <Github className="w-4 h-4" /> Source Code
                          </a>
                          {sub.demoUrl && (
                            <a
                              href={sub.demoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-sm font-medium text-white transition-colors"
                            >
                              <Globe className="w-4 h-4" /> Live Demo
                            </a>
                          )}
                          {sub.documentUrl && (
                            <a
                              href={sub.documentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-sm font-medium text-white transition-colors"
                            >
                              <FileText className="w-4 h-4" /> Tài liệu
                            </a>
                          )}
                        </div>

                        {!sub.isDisqualified ? (
                          <>
                            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Phiếu Chấm Điểm</h4>
                            <GradingForm
                              criteria={selectedRound.criteria}
                              onSubmit={(scores) => handleSubmitEvaluation(sub.id, scores)}
                              isSubmitting={submittingId === sub.id}
                              disabledMessage={disabledMessage}
                            />
                          </>
                        ) : (
                          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                            <p className="text-sm font-bold text-red-400 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" />
                              Đội thi này đã bị loại. Không thể chấm điểm.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
