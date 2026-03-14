import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Polyglot",
  description: "英文阅读学习器",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
