"use client";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import AccountingNav from "@/components/accounting/AccountingNav";
import {
  PieChart,
  Pie,
  Tooltip,
  Legend,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardData {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  transactionCount: number;
  monthly: { month: string; income: number; expense: number }[];
  byCategory: { name: string; emoji: string; total: number }[];
}

const PIE_COLORS = [
  "#f59e0b",
  "#3b82f6",
  "#22c55e",
  "#a855f7",
  "#ef4444",
  "#06b6d4",
  "#f97316",
  "#ec4899",
];

function formatEur(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(n);
}

export default function AccountingDashboardPage() {
  const { t } = useLang();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    fetch("/api/accounting/dashboard")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();

    const onFocus = () => fetchData();
    const onVisibility = () => { if (document.visibilityState === "visible") fetchData(); };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const isPositive = (data?.balance ?? 0) >= 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.accounting}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t.accountingSubtitle}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      <AccountingNav />

      {loading ? (
        <div className="text-muted-foreground text-sm">Chargement...</div>
      ) : (
        <>
          {/* Balance card */}
          <div
            className={`rounded-xl border p-6 bg-card ${
              isPositive ? "border-green-500/40" : "border-red-500/40"
            }`}
          >
            <p className="text-sm text-muted-foreground font-medium mb-1">{t.balance}</p>
            <p
              className={`text-4xl font-bold ${
                isPositive ? "text-green-400" : "text-red-400"
              }`}
            >
              {formatEur(data?.balance ?? 0)}
            </p>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground mb-1">{t.income}</p>
              <p className="text-2xl font-bold text-green-400">
                {formatEur(data?.totalIncome ?? 0)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground mb-1">{t.expense}</p>
              <p className="text-2xl font-bold text-red-400">
                {formatEur(data?.totalExpense ?? 0)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground mb-1">{t.transactions}</p>
              <p className="text-2xl font-bold text-foreground">
                {data?.transactionCount ?? 0}
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie — expenses by category */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">
                {t.expense} — par catégorie
              </h2>
              {!data?.byCategory?.length ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                  Aucune dépense
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={data.byCategory}
                      dataKey="total"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {data.byCategory.map((_, index) => (
                        <Cell
                          key={index}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatEur(value)}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Bar — last 12 months */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">
                12 derniers mois
              </h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data?.monthly ?? []} barGap={2}>
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}€`}
                  />
                  <Tooltip
                    formatter={(value: number) => formatEur(value)}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="income" name={t.income} fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name={t.expense} fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
