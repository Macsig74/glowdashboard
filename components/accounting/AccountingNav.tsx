"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

const TABS = [
  { href: "/accounting",              labelKey: "dashboard"     as const },
  { href: "/accounting/categories",   labelKey: "categories"    as const },
  { href: "/accounting/transactions", labelKey: "transactions"  as const },
];

export default function AccountingNav() {
  const pathname = usePathname();
  const { t } = useLang();

  return (
    <div className="flex gap-1 border-b border-border mb-6">
      {TABS.map(({ href, labelKey }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t[labelKey]}
          </Link>
        );
      })}
    </div>
  );
}
