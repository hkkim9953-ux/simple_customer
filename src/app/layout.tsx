import type { Metadata } from "next";
import { Suspense } from "react";
import { Noto_Sans_KR } from "next/font/google";
import AppToaster from "@/components/AppToaster";
import Header from "@/components/Header";
import { getOptionalSession } from "@/lib/firebase/auth";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SimpleReserve | 온라인 예약 시스템",
  description: "심플하고 빠른 고객 예약 관리 서비스",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let userEmail: string | null = null;

  try {
    const session = await getOptionalSession();
    userEmail = session?.email ?? null;
  } catch {
    // env 미설정 시에도 UI는 렌더링
  }

  return (
    <html lang="ko" className={`${notoSansKr.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <Header userEmail={userEmail} />
        {children}
        <Suspense fallback={null}>
          <AppToaster />
        </Suspense>
      </body>
    </html>
  );
}
