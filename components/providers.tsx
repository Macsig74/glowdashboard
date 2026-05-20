"use client";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { LangProvider } from "@/lib/i18n";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <LangProvider>
          {children}
        </LangProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
