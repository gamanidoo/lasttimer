// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClientBeforeUnloadHandler } from "./ClientBeforeUnloadHandler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "시간분배 타이머",
  description: "시간을 효율적으로 분배하여 집중할 수 있도록 도와주는 타이머",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            // Pull-to-refresh 방지 및 얼럿 표시
            let touchStartY = 0;
            document.addEventListener('touchstart', function(e) {
              touchStartY = e.touches[0].clientY;
            }, { passive: false });
            
            document.addEventListener('touchmove', function(e) {
              const touchY = e.touches[0].clientY;
              const touchDiff = touchY - touchStartY;
              
              // 위로 스크롤하고 있고, 페이지 최상단이면
              if (touchDiff > 0 && window.scrollY === 0) {
                // 실행 중인 타이머가 있는지 확인
                const isRunning = document.body.dataset.isRunning === 'true';
                if (isRunning && !confirm('진행 중인 타이머를 초기화하시겠습니까?')) {
                  e.preventDefault();
                }
              }
            }, { passive: false });
          `
        }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClientBeforeUnloadHandler />
        {children}
      </body>
    </html>
  );
}
