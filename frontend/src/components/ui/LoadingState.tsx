import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  fullPage?: boolean;
}

export default function LoadingState({
  message = "Đang tải...",
  fullPage = false,
}: LoadingStateProps) {
  const wrapper = fullPage
    ? "flex min-h-screen items-center justify-center bg-[#080b11]"
    : "flex flex-col items-center justify-center py-20 gap-4";

  return (
    <div className={wrapper}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-white/10" />
          <Loader2
            size={48}
            className="absolute inset-0 text-orange-500 animate-spin"
          />
        </div>
        <p className="text-slate-400 text-sm">{message}</p>
      </div>
    </div>
  );
}
