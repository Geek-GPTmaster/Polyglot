import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/context/LanguageContext";
import { ToastProvider } from "@/components/Toast";
import NavBar from "@/components/NavBar";
import FontSizeSync from "@/components/FontSizeSync";

export const metadata: Metadata = {
  title: "Polyglot — Language Learning Reader",
  description:
    "Import articles, look up words, build vocabulary, and review with flashcards.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts — loaded at runtime so build works without network access */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>
        <FontSizeSync />
        <LanguageProvider>
          <ToastProvider>
            <NavBar />
            <main
              style={{
                minHeight: "calc(100vh - 56px)",
                paddingTop: "var(--space-2)",
              }}
            >
              {children}
            </main>
          </ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
