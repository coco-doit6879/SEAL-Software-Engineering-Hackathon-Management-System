import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({
  icon,
  title = "Không có dữ liệu",
  description = "Hiện chưa có dữ liệu nào để hiển thị.",
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <h3 className="text-white font-semibold">{title}</h3>
        <p className="text-sm text-slate-400 max-w-xs">{description}</p>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
