"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  FileText,
  CheckCircle,
  Database,
  RefreshCw,
  Lock,
  LogOut,
  HelpCircle,
  Trophy,
  Users,
  Terminal,
  Bookmark
} from "lucide-react";

interface Message {
  sender: "user" | "ai";
  text: string;
  context?: Array<{ title: string; similarity: number }>;
}

interface EventItem {
  id: string;
  name: string;
  term: string;
  year: number;
  status: string;
}

export default function AIAssistantPage() {
  // Auth state
  const [token, setToken] = useState<string>("");
  const [user, setUser] = useState<{ fullName: string; email: string; role: string } | null>(null);
  const [authError, setAuthError] = useState<string>("");
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<"rag" | "agent">("rag");

  // RAG Chat State
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "Xin chào! Tôi là Trợ lý Quy chế của SEAL Hackathon. Tôi có thể giúp gì cho bạn? Bạn có thể hỏi tôi về quy định nộp bài, thời hạn, cách tính điểm hoặc quy trình chấm thử (Calibration).",
    },
  ]);
  const [chatInput, setChatInput] = useState<string>("");
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [seedMessage, setSeedMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);

  // Database Agent State
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [analysisReport, setAnalysisReport] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(false);
  const [agentError, setAgentError] = useState<string>("");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const BACKEND_URL = "http://localhost:5000";

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("seal_hms_token");
    const savedUser = localStorage.getItem("seal_hms_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Fetch events when entering the Agent tab
  useEffect(() => {
    if (activeTab === "agent" && token) {
      fetchEvents();
    }
  }, [activeTab, token]);

  const handleQuickLogin = async (email: string) => {
    setIsLoggingIn(true);
    setAuthError("");
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password: "Password123!",
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.message || "Đăng nhập thất bại.");
      }

      const userToken = resData.data.token;
      const userData = resData.data.user;

      setToken(userToken);
      setUser(userData);
      localStorage.setItem("seal_hms_token", userToken);
      localStorage.setItem("seal_hms_user", JSON.stringify(userData));
    } catch (err: any) {
      setAuthError(err.message || "Lỗi kết nối tới Server.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("seal_hms_token");
    localStorage.removeItem("seal_hms_user");
    setAnalysisReport("");
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || chatInput;
    if (!query.trim()) return;

    if (!textToSend) setChatInput("");
    setMessages((prev) => [...prev, { sender: "user", text: query }]);
    setIsChatLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/ai/chat-rules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: query }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || "Không thể tải phản hồi từ AI.");
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: resData.data.answer,
          context: resData.data.context,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `❌ Lỗi: ${err.message || "Không thể kết nối đến máy chủ AI."}`,
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSeedRules = async () => {
    setIsSeeding(true);
    setSeedMessage(null);
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/ai/seed-rules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || "Lỗi trong quá trình nạp dữ liệu.");
      }

      setSeedMessage({
        type: "success",
        text: `✅ Thành công: Đã nạp thành công ${resData.count} quy tắc cuộc thi mẫu cùng vector tương đồng.`,
      });
    } catch (err: any) {
      setSeedMessage({
        type: "error",
        text: `❌ Thất bại: ${err.message}`,
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const fetchEvents = async () => {
    setIsLoadingEvents(true);
    setAgentError("");
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/events`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message || "Lỗi fetch sự kiện.");

      setEvents(resData.data || []);
      if (resData.data && resData.data.length > 0) {
        setSelectedEventId(resData.data[0].id);
      }
    } catch (err: any) {
      setAgentError("Không thể tải danh sách sự kiện từ server.");
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const handleAnalyzeEvent = async () => {
    if (!selectedEventId) return;
    setIsAnalyzing(true);
    setAnalysisReport("");
    setAgentError("");

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/ai/analyze/event/${selectedEventId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || "Lỗi trong quá trình phân tích sự kiện.");
      }

      setAnalysisReport(resData.data.report);
    } catch (err: any) {
      setAgentError(err.message || "Không thể thực hiện phân tích số liệu giải đấu.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const parseMarkdownToJSX = (text: string) => {
    if (!text) return null;
    const lines = text.split("\n");
    return (
      <div className="space-y-4 text-slate-300 text-sm md:text-base leading-relaxed">
        {lines.map((line, idx) => {
          // Headers
          if (line.startsWith("### ")) {
            return (
              <h3 key={idx} className="text-base md:text-lg font-bold text-orange-400 mt-6 mb-2 flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-orange-400" />
                {line.substring(4)}
              </h3>
            );
          }
          if (line.startsWith("## ")) {
            return (
              <h2 key={idx} className="text-lg md:text-xl font-black text-white mt-8 mb-3 border-b border-slate-800 pb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-500" />
                {line.substring(3)}
              </h2>
            );
          }
          if (line.startsWith("# ")) {
            return (
              <h1 key={idx} className="text-xl md:text-2xl font-extrabold text-white mt-10 mb-4 bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                {line.substring(2)}
              </h1>
            );
          }
          // Bullet points
          if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
            const rawContent = line.replace(/^\s*[-*]\s+/, "");
            return (
              <li key={idx} className="ml-6 list-disc text-slate-300 pl-1">
                {renderInlineMarkdown(rawContent)}
              </li>
            );
          }
          // Regular paragraphs
          if (line.trim() === "") return <div key={idx} className="h-2" />;
          return <p key={idx} className="text-slate-300">{renderInlineMarkdown(line)}</p>;
        })}
      </div>
    );
  };

  const renderInlineMarkdown = (text: string) => {
    // Basic parser for **bold** and `code`
    const parts = [];
    let currentIdx = 0;
    const boldRegex = /\*\*(.*?)\*\*/g;
    const codeRegex = /`(.*?)`/g;

    // Combine regex to find matches sequentially (simplified tokenization)
    const matches: Array<{ start: number; end: number; type: "bold" | "code"; text: string }> = [];

    let boldMatch;
    while ((boldMatch = boldRegex.exec(text)) !== null) {
      matches.push({
        start: boldMatch.index,
        end: boldMatch.index + boldMatch[0].length,
        type: "bold",
        text: boldMatch[1],
      });
    }

    let codeMatch;
    while ((codeMatch = codeRegex.exec(text)) !== null) {
      matches.push({
        start: codeMatch.index,
        end: codeMatch.index + codeMatch[0].length,
        type: "code",
        text: codeMatch[1],
      });
    }

    // Sort matches by start index
    matches.sort((a, b) => a.start - b.start);

    // Build parts
    let lastIndex = 0;
    for (const match of matches) {
      if (match.start < lastIndex) continue; // skip overlapping (safety check)

      // Add text before match
      if (match.start > lastIndex) {
        parts.push(text.substring(lastIndex, match.start));
      }

      // Add match
      if (match.type === "bold") {
        parts.push(<strong key={match.start} className="font-semibold text-orange-200">{match.text}</strong>);
      } else if (match.type === "code") {
        parts.push(<code key={match.start} className="px-1.5 py-0.5 rounded bg-slate-950 text-orange-300 font-mono text-xs border border-slate-800">{match.text}</code>);
      }

      lastIndex = match.end;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  const suggestedQuestions = [
    "Tôi có được nộp bài trễ deadline không?",
    "Tiêu chí chấm điểm kỹ thuật chiếm bao nhiêu %?",
    "Quy trình chấm thử Calibration hoạt động như thế nào?",
    "Làm sao để được đi tiếp vào vòng sau?"
  ];

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="z-10 border-b border-slate-900 bg-slate-950/70 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center font-bold text-white text-lg shadow-md shadow-orange-500/10">
            SL
          </div>
          <div>
            <h1 className="text-md md:text-lg font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              SEAL-HMS AI Portal
            </h1>
            <p className="text-xs text-slate-400">Trợ Lý Ảo Phân Tích & Hỏi Đáp Quy Chế</p>
          </div>
        </div>

        {user ? (
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-white">{user.fullName}</p>
              <span className="inline-flex px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 text-2xs font-bold border border-orange-500/20">
                {user.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all flex items-center gap-2"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs font-semibold hidden md:inline">Đăng xuất</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden lg:inline mr-2 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-orange-400" /> Chọn tài khoản demo để trải nghiệm:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                disabled={isLoggingIn}
                onClick={() => handleQuickLogin("coordinator@fpt.edu.vn")}
                className="px-3 py-1.5 rounded-lg text-xs bg-slate-900 border border-slate-800 hover:border-orange-500/40 hover:bg-orange-500/5 text-slate-300 font-medium transition-all"
              >
                BTC (Admin)
              </button>
              <button
                disabled={isLoggingIn}
                onClick={() => handleQuickLogin("faculty.judge@fpt.edu.vn")}
                className="px-3 py-1.5 rounded-lg text-xs bg-slate-900 border border-slate-800 hover:border-blue-500/40 hover:bg-blue-500/5 text-slate-300 font-medium transition-all"
              >
                Giám Khảo
              </button>
              <button
                disabled={isLoggingIn}
                onClick={() => handleQuickLogin("student1@fpt.edu.vn")}
                className="px-3 py-1.5 rounded-lg text-xs bg-slate-900 border border-slate-800 hover:border-emerald-500/40 hover:bg-emerald-500/5 text-slate-300 font-medium transition-all"
              >
                Thí Sinh
              </button>
            </div>
          </div>
        )}
      </header>

      {authError && (
        <div className="bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs px-6 py-2.5 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>Lỗi đăng nhập: {authError}. Hãy chắc chắn backend đang chạy tại {BACKEND_URL} và dữ liệu seed đã được nạp.</span>
        </div>
      )}

      {/* Main Body */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-6 gap-6 z-10">
        
        {/* Sidebar Controls */}
        <aside className="w-full md:w-80 flex flex-col gap-6 flex-shrink-0">
          
          {/* Welcome Info Card */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-900 flex flex-col gap-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-400" /> Về Hệ Thống AI
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Trang trợ lý ảo cung cấp hai phân hệ độc lập: Hỏi đáp RAG cho phép tra cứu quy chế học thuật, và Agent phân tích giải đấu hỗ trợ trích xuất báo cáo từ điểm số và nhận xét của giám khảo.
            </p>
            
            {user && user.role === "COORDINATOR" && activeTab === "rag" && (
              <div className="pt-2 border-t border-slate-900 mt-2">
                <p className="text-2xs text-slate-500 mb-2 font-medium">BẢN ĐỒ DỮ LIỆU RAG (Đầu vào Quy chế):</p>
                <button
                  disabled={isSeeding}
                  onClick={handleSeedRules}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 disabled:text-slate-600 flex items-center justify-center gap-2 transition-all text-white shadow-lg shadow-orange-500/10"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? "animate-spin" : ""}`} />
                  {isSeeding ? "Đang nạp vector..." : "Nạp Vector Quy Chế Mẫu"}
                </button>
                {seedMessage && (
                  <p className={`text-2xs mt-2 font-medium ${seedMessage.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
                    {seedMessage.text}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Tab Selector Card */}
          <div className="glass-panel p-2 rounded-xl border border-slate-900 flex flex-row md:flex-col gap-1">
            <button
              onClick={() => setActiveTab("rag")}
              className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold transition-all flex items-center gap-2 justify-center md:justify-start ${
                activeTab === "rag"
                  ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md shadow-orange-500/10"
                  : "text-slate-400 hover:bg-slate-900/60 hover:text-white"
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Hỏi Đáp Luật & Quy Chế</span>
            </button>
            <button
              onClick={() => {
                if (!token) {
                  setAuthError("Vui lòng click chọn tài khoản demo để đăng nhập trước khi xem Phân Tích.");
                  return;
                }
                if (user && user.role !== "COORDINATOR" && user.role !== "INTERNAL_JUDGE" && user.role !== "GUEST_JUDGE") {
                  setAuthError("Quyền truy cập bị từ chối: Phân tích số liệu chỉ dành cho Coordinator hoặc Giám Khảo.");
                  return;
                }
                setActiveTab("agent");
              }}
              className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold transition-all flex items-center gap-2 justify-center md:justify-start ${
                activeTab === "agent"
                  ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md shadow-orange-500/10"
                  : "text-slate-400 hover:bg-slate-900/60 hover:text-white"
              } ${!token || (user && !["COORDINATOR", "INTERNAL_JUDGE", "GUEST_JUDGE"].includes(user.role)) ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Database className="w-4 h-4" />
              <span>Trợ Lý Phân Tích Đội Thi</span>
            </button>
          </div>
          
        </aside>

        {/* Work Area */}
        <main className="flex-1 flex flex-col min-h-[500px] glass-panel rounded-2xl border border-slate-900 overflow-hidden bg-slate-950/20">
          
          {!token && activeTab === "rag" && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 z-20">
              <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center text-orange-400 border border-slate-800 mb-4 animate-bounce">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Yêu Cầu Xác Thực</h3>
              <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
                Hệ thống AI yêu cầu tài khoản đã đăng nhập để có thể sử dụng các dịch vụ sinh nội dung và vector tương đồng.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleQuickLogin("student1@fpt.edu.vn")}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white transition-all"
                >
                  Trải nghiệm nhanh với vai Thí Sinh
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: RAG CHAT */}
          {activeTab === "rag" && (
            <div className="flex-1 flex flex-col h-full">
              {/* Header inside work area */}
              <div className="px-6 py-4 border-b border-slate-900 bg-slate-950/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-orange-400" />
                  <div>
                    <h2 className="text-sm font-bold text-white">Phân hệ Hỏi đáp Quy chế & Thể lệ</h2>
                    <p className="text-2xs text-slate-500">Retrieval-Augmented Generation (RAG) powered by Gemini</p>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[450px]">
                {messages.map((msg, index) => (
                  <div key={index} className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    
                    {msg.sender === "ai" && (
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-orange-400" />
                      </div>
                    )}

                    <div className="max-w-[80%] flex flex-col gap-1.5">
                      <div
                        className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                          msg.sender === "user"
                            ? "bg-orange-600 text-white rounded-tr-none shadow-md shadow-orange-600/10"
                            : "bg-slate-900/60 border border-slate-900 text-slate-200 rounded-tl-none"
                        }`}
                      >
                        {msg.text}
                      </div>

                      {/* RAG Retrieved Context Metadata */}
                      {msg.sender === "ai" && msg.context && msg.context.length > 0 && (
                        <div className="flex flex-col gap-1 mt-1 pl-1">
                          <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider">
                            <Terminal className="w-3 h-3 text-orange-500/70" /> Tài liệu quy chế đối chiếu:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {msg.context.map((c, cIdx) => (
                              <span
                                key={cIdx}
                                className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-900/40 text-[10px] text-slate-400 border border-slate-900/80 font-medium"
                                title={`Độ tương đồng ngữ cảnh: ${Math.round(c.similarity * 100)}%`}
                              >
                                {c.title} ({Math.round(c.similarity * 100)}%)
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {msg.sender === "user" && (
                      <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                  </div>
                ))}
                
                {isChatLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center animate-pulse">
                      <Bot className="w-4 h-4 text-orange-400" />
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-900 text-slate-400 text-sm italic animate-pulse flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-500" /> Trợ lý đang tra cứu quy chế...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Suggestions */}
              {messages.length === 1 && (
                <div className="px-6 py-2">
                  <p className="text-2xs text-slate-500 mb-2 font-bold flex items-center gap-1 uppercase tracking-wider">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-500" /> Câu hỏi gợi ý cho bạn:
                  </p>
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                    {suggestedQuestions.map((q, qIdx) => (
                      <button
                        key={qIdx}
                        onClick={() => handleSendMessage(q)}
                        className="py-2 px-3 rounded-xl border border-slate-900 bg-slate-900/30 hover:border-orange-500/20 hover:bg-orange-500/5 text-xs text-left text-slate-400 hover:text-white transition-all flex items-center gap-2"
                      >
                        <span>💡</span>
                        <span>{q}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Input form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-4 border-t border-slate-900 bg-slate-950/40 flex gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Hỏi về quy định nộp trễ, cơ chế đi tiếp, tiêu chí chấm điểm..."
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-900 bg-slate-950/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 transition-all"
                  disabled={isChatLoading}
                />
                <button
                  type="submit"
                  className="px-5 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:bg-slate-900 disabled:text-slate-600 font-bold transition-all text-white flex items-center justify-center gap-2 shadow-lg shadow-orange-500/10"
                  disabled={isChatLoading || !chatInput.trim()}
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Gửi</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: DATABASE AGENT */}
          {activeTab === "agent" && (
            <div className="flex-1 flex flex-col h-full">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-900 bg-slate-950/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-orange-400" />
                  <div>
                    <h2 className="text-sm font-bold text-white">Phân hệ Trợ lý phân tích số liệu giải đấu</h2>
                    <p className="text-2xs text-slate-500">Database Analyst Agent powered by Gemini</p>
                  </div>
                </div>
              </div>

              {/* Control Panel */}
              <div className="p-6 border-b border-slate-900 bg-slate-950/10 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3 items-center flex-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">Chọn sự kiện:</label>
                  {isLoadingEvents ? (
                    <div className="text-xs text-slate-500 animate-pulse flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang tải danh sách sự kiện...
                    </div>
                  ) : events.length === 0 ? (
                    <div className="text-xs text-red-400">Không có sự kiện nào trong cơ sở dữ liệu.</div>
                  ) : (
                    <select
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      className="w-full max-w-sm px-4 py-2.5 rounded-xl border border-slate-900 bg-slate-950 text-xs font-semibold text-white focus:outline-none focus:border-orange-500/40"
                    >
                      {events.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.name} ({ev.term} {ev.year}) - Trạng thái: {ev.status}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <button
                  onClick={handleAnalyzeEvent}
                  disabled={isAnalyzing || !selectedEventId}
                  className="w-full md:w-auto px-5 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:bg-slate-900 disabled:text-slate-600 font-bold transition-all text-white flex items-center justify-center gap-2 shadow-lg shadow-orange-500/10 flex-shrink-0"
                >
                  <TrendingUp className={`w-4 h-4 ${isAnalyzing ? "animate-pulse text-amber-300" : ""}`} />
                  <span>{isAnalyzing ? "Đang phân tích dữ liệu giải đấu..." : "Chạy Phân Tích Sự Kiện"}</span>
                </button>
              </div>

              {/* Main Content Area / Report Display */}
              <div className="flex-1 p-6 overflow-y-auto max-h-[400px] bg-slate-950/30">
                {agentError && (
                  <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{agentError}</span>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="flex flex-col items-center justify-center text-center py-20 gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shadow-md shadow-orange-500/5 animate-spin">
                      <RefreshCw className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white mb-1">Đang trích xuất & phân tích dữ liệu...</h3>
                      <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                        Hệ thống đang tổng hợp điểm số các vòng, phân hạng Leaderboard, đọc bình luận của Giám khảo và kết nối LLM để viết báo cáo hạt giống.
                      </p>
                    </div>
                  </div>
                )}

                {!isAnalyzing && !analysisReport && !agentError && (
                  <div className="flex flex-col items-center justify-center text-center py-20 text-slate-500 gap-3">
                    <FileText className="w-12 h-12 text-slate-800" />
                    <div>
                      <p className="text-sm font-bold text-slate-400">Chưa có báo cáo phân tích</p>
                      <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
                        Chọn một sự kiện ở trên và click "Chạy Phân Tích Sự Kiện" để AI phân tích số liệu chấm điểm và dự đoán đội hạt giống.
                      </p>
                    </div>
                  </div>
                )}

                {!isAnalyzing && analysisReport && (
                  <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/80 shadow-inner">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-900 mb-6">
                      <span className="text-xs text-slate-500 font-medium">BÁO CÁO PHÂN TÍCH HỆ THỐNG AI</span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-2xs font-bold border border-emerald-500/20">
                        <CheckCircle className="w-3 h-3" /> Đã hoàn thành
                      </span>
                    </div>
                    {parseMarkdownToJSX(analysisReport)}
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Footer */}
      <footer className="z-10 border-t border-slate-900 bg-slate-950/40 text-center py-4 text-xs text-slate-500">
        <p>© 2026 SEAL-HMS Project. Khoa Kỹ thuật Phần mềm & PDP - Đại học FPT TP.HCM.</p>
      </footer>
    </div>
  );
}
