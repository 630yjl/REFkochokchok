import type { Metadata } from "next";
// import localFont from "next/font/local";
import "./globals.css";
import  NavigationWrapper  from "@/commons/navigation/NavWrapper";
import '@/commons/fetch-interceptor';
import { Toaster } from 'react-hot-toast'; 

// const geistSans = localFont({
//   src: "fonts/GeistVF.woff",
//   variable: "--font-geist-sans",
//   weight: "100 900",
// });
// const geistMono = localFont({
//   src: "fonts/GeistMonoVF.woff",
//   variable: "--font-geist-mono",
//   weight: "100 900",
// });

export const metadata: Metadata = {
  title: "코촉촉",
  description: "반려동물 돌봄 연결 및 중고거래 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <NavigationWrapper>
          <main>{children}</main>
        </NavigationWrapper>
        <Toaster /> 
      </body>

      {/* 이전에 작성되어있던것 */}
      {/* <body
        // className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body> */}
    </html>
  );
}
