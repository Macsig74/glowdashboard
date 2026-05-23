import { NextRequest, NextResponse } from "next/server";
import { getDb, uuid } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM gs_acc_categories ORDER BY created_at ASC").all();
    return NextResponse.json(rows);
  } catch (err) {
    console.error("[accounting/categories GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, emoji } = body ?? {};
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    const db = getDb();
    const id = uuid();
    db.prepare(
      "INSERT INTO gs_acc_categories (id, name, emoji) VALUES (?, ?, ?)"
    ).run(id, name.trim(), (emoji ?? "📁").trim() || "📁");
    const row = db.prepare("SELECT * FROM gs_acc_categories WHERE id = ?").get(id);
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    console.error("[accounting/categories POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
