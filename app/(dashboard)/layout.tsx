"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/layout/sidebar";
import ThemeToggle from "@/components/layout/theme-toggle";
import LangToggle from "@/components/layout/lang-toggle";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64">
        <div className="flex items-center justify-end gap-1 px-6 py-4 border-b border-border">
          <LangToggle />
          <ThemeToggle />
        </div>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
