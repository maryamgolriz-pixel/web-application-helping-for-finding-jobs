import type { Metadata } from "next";
import { Inter, Vazirmatn } from "next/font/google";
import "./globals.css";

const vazirmatn = Vazirmatn({ subsets: ["arabic", "latin"], variable: "--font-vazirmatn" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Matchora | مربی رزومه برای کانادا",
  description:
    "رزومه‌تان را با یک آگهی شغلی مقایسه کنید و برای بازار کار کانادا آماده‌اش کنید: امتیاز تطابق، کلیدواژه‌ها، نکات فرمت، بازنویسی جمله‌ها و کاور لتر.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} ${inter.variable}`}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
