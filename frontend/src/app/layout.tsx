import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SEAL-HMS | Hackathon Management System",
    template: "%s | SEAL-HMS",
  },
  description:
    "Nền tảng quản lý cuộc thi hackathon học thuật của Khoa Kỹ thuật Phần mềm – Đại học FPT TP.HCM.",
  keywords: ["SEAL", "hackathon", "FPT", "management", "software engineering"],
  authors: [{ name: "SEAL Team" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-[#080b11] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
