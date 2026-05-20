"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Server, Package, LogOut, Zap } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useLang();

  const navItems = [
    { href: "/", label: t.dashboard, icon: LayoutDashboard },
    { href: "/staff", label: t.staff, icon: Users },
    { href: "/servers", label: t.servers, icon: Server },
    { href: "/bbb", label: t.bbb, icon: Package },
  ];

  return (
    <aside className="flex flex-col h-screen w-64 bg-sidebar border-r border-sidebar-border fixed left-0 top-0 z-40">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Zap className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-bold text-lg text-sidebar-foreground">GlowStudio</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
              pathname === href
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border">
        {session && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
              {session.user?.name?.[0]?.toUpperCase()}
            </div>
            <span className="text-sm text-sidebar-foreground font-medium truncate">
              {session.user?.name}
            </span>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {t.logout}
        </button>
      </div>
    </aside>
  );
}
