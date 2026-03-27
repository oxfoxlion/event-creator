import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "活動卡片平台",
  description: "活動簽到與活動卡片系統",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
