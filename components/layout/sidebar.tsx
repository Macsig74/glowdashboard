"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Server, Package, LogOut, Zap, Shield, Globe, Ticket, Calculator } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { useEffect, useState } from "react";

const ALL_NAV_ITEMS = [
  { href: "/", label: "dashboard" as const, icon: LayoutDashboard, salon: null },
  { href: "/staff", label: "staff" as const, icon: Users, salon: "staff" },
  { href: "/servers", label: "servers" as const, icon: Server, salon: "servers" },
  { href: "/bbb", label: "bbb" as const, icon: Package, salon: "bbb" },
  { href: "/tickets", label: "tickets" as const, icon: Ticket, salon: null },
  { href: "/accounting", label: "accounting" as const, icon: Calculator, salon: null },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useLang();
  const [allowedSalons, setAllowedSalons] = useState<string[] | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/admin/my-access")
      .then((r) => r.json())
      .then((data) => setAllowedSalons(data.salons ?? []))
      .catch(() => setAllowedSalons([]));
  }, [session]);

  const isAdmin = session?.user?.isAdmin ?? false;

  const visibleItems = ALL_NAV_ITEMS.filter(({ salon }) => {
    if (salon === null) return true; // dashboard always visible
    if (isAdmin) return true;
    if (!allowedSalons) return false; // loading
    return allowedSalons.includes(salon);
  });

  return (
    <aside className="flex flex-col h-screen w-64 bg-sidebar border-r border-sidebar-border fixed left-0 top-0 z-40">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Zap className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-bold text-lg text-sidebar-foreground">GlowStudio</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map(({ href, label, icon: Icon }) => (
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
            {t[label]}
          </Link>
        ))}

        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
              pathname === "/admin"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
            )}
          >
            <Shield className="w-4 h-4" />
            {t.adminTitle}
          </Link>
        )}

        <a
          href="/accueil"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors"
        >
          <Globe className="w-4 h-4" />
          Page accueil
        </a>
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border">
        {session && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
              {session.user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-sidebar-foreground font-medium truncate">
                {session.user?.name}
              </p>
              {isAdmin && (
                <p className="text-xs text-primary font-medium">{t.adminBadge}</p>
              )}
            </div>
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
