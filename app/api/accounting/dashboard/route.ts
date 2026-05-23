import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

function getLastTwelveMonths(): { key: string; label: string }[] {
  const months: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth(); // 0-based
    const key = `${year}-${String(month + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
    months.push({ key, label });
  }
  return months;
}

export async function GET() {
  try {
    const db = getDb();

    // Balance (all time)
    const balanceRow = db
      .prepare(
        `SELECT
           COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END), 0) AS total_income,
           COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) AS total_expense
         FROM gs_transactions`
      )
      .get() as { total_income: number; total_expense: number };

    const balance = (balanceRow?.total_income ?? 0) - (balanceRow?.total_expense ?? 0);
    const totalIncome = balanceRow?.total_income ?? 0;
    const totalExpense = balanceRow?.total_expense ?? 0;

    // Monthly sums for last 12 months
    const monthlyRaw = db
      .prepare(
        `SELECT
           strftime('%Y-%m', date) AS month_key,
           COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END), 0) AS income,
           COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) AS expense
         FROM gs_transactions
         GROUP BY strftime('%Y-%m', date)`
      )
      .all() as { month_key: string; income: number; expense: number }[];

    const monthlyMap = new Map(monthlyRaw.map((r) => [r.month_key, r]));
    const last12 = getLastTwelveMonths();
    const monthly = last12.map(({ key, label }) => {
      const row = monthlyMap.get(key);
      return {
        month: label,
        income: row?.income ?? 0,
        expense: row?.expense ?? 0,
      };
    });

    // By category (expense only)
    const byCategory = db
      .prepare(
        `SELECT
           COALESCE(c.name,  'Sans catégorie') AS name,
           COALESCE(c.emoji, '📁')              AS emoji,
           SUM(t.amount)                        AS total
         FROM gs_transactions t
         LEFT JOIN gs_acc_categories c ON c.id = t.category_id
         WHERE t.type = 'expense'
         GROUP BY t.category_id
         ORDER BY total DESC`
      )
      .all() as { name: string; emoji: string; total: number }[];

    // Transaction count
    const countRow = db
      .prepare("SELECT COUNT(*) AS cnt FROM gs_transactions")
      .get() as { cnt: number };

    return NextResponse.json({
      balance,
      totalIncome,
      totalExpense,
      transactionCount: countRow?.cnt ?? 0,
      monthly,
      byCategory,
    });
  } catch (err) {
    console.error("[accounting/dashboard GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
