import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "특별실 현황",
  description: "체육관·시청각실·컴퓨터실 등 특별실의 예약과 실제 사용 여부를 한곳에서 확인해요.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f8fafc",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="min-h-dvh bg-slate-50 text-slate-900 antialiased">
        <div className="mx-auto max-w-3xl px-4 pb-16 pt-6">{children}</div>
      </body>
    </html>
  );
}
