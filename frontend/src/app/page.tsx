import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-20 text-center md:px-24">
      {/* Background Glowing Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-orange-600 opacity-20 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/3 w-96 h-96 rounded-full bg-blue-600 opacity-10 blur-3xl pointer-events-none"></div>

      <div className="z-10 max-w-4xl w-full">
        {/* Logo / Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/20 bg-orange-500/10 text-orange-400 text-sm font-medium mb-6 animate-pulse">
          <span>🏆</span>
          <span>SEAL Hackathon 2026 - Academic League</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white via-slate-200 to-orange-400 bg-clip-text text-transparent">
          Software Engineering Agile League
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Nền tảng quản lý cuộc thi hackathon học thuật và phân tích đánh giá chuyên nghiệp của Khoa Kỹ thuật Phần mềm phối hợp với PDP tại Đại học FPT TP.HCM.
        </p>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/auth/login"
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-500/20 hover:scale-105 transition-all text-white"
          >
            Đăng nhập hệ thống
          </Link>
          <Link
            href="/auth/register"
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold glass-panel hover:bg-slate-800/80 transition-all border border-slate-700 hover:scale-105"
          >
            Đăng ký tham gia
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {/* Card 1 */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover-scale">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-2xl mb-4">
              🛡️
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Đăng ký & Duyệt bảo mật</h3>
            <p className="text-sm text-slate-400">
              Phân loại sinh viên FPT và sinh viên ngoài trường. Tất cả thông tin đội thi và thành viên đều được kiểm duyệt chặt chẽ bởi Ban tổ chức.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover-scale">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-2xl mb-4">
              📊
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Hiệu chuẩn Chấm điểm (RBL)</h3>
            <p className="text-sm text-slate-400">
              Công cụ thống kê trực quan độ lệch chuẩn của các giám khảo, giúp tăng tính minh bạch, sự thống nhất và tính công bằng trong đánh giá phần mềm.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 hover-scale">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-2xl mb-4">
              ⚡
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Tự động hóa toàn diện</h3>
            <p className="text-sm text-slate-400">
              Tự động hóa xếp hạng, thăng hạng các đội xuất sắc nhất vào vòng tiếp theo. Nhật ký kiểm toán (Audit logs) ghi nhận mọi hành động chấm điểm.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
