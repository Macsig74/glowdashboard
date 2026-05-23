import { NextRequest, NextResponse } from "next/server";
import { getDb, uuid } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT
           t.*,
           c.name  AS category_name,
           c.emoji AS category_emoji,
           (SELECT COUNT(*) FROM gs_transaction_docs d WHERE d.transaction_id = t.id) AS doc_count
         FROM gs_transactions t
         LEFT JOIN gs_acc_categories c ON c.id = t.category_id
         ORDER BY t.date DESC, t.created_at DESC`
      )
      .all();
    return NextResponse.json(rows);
  } catch (err) {
    console.error("[accounting/transactions GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const label = formData.get("label") as string | null;
    const amount = formData.get("amount") as string | null;
    const type = formData.get("type") as string | null;
    const category_id = formData.get("category_id") as string | null;
    const date = formData.get("date") as string | null;
    const notes = formData.get("notes") as string | null;

    if (!label || !amount || !type || !date) {
      return NextResponse.json(
        { error: "label, amount, type and date are required" },
        { status: 400 }
      );
    }
    if (!["income", "expense"].includes(type)) {
      return NextResponse.json({ error: "type must be income or expense" }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 });
    }

    const db = getDb();
    const id = uuid();

    db.prepare(
      `INSERT INTO gs_transactions (id, label, amount, type, category_id, date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      label.trim(),
      parsedAmount,
      type,
      category_id?.trim() || null,
      date,
      notes?.trim() || null
    );

    // Handle file uploads
    const files = formData.getAll("docs") as File[];
    const maxFiles = Math.min(files.length, 5);

    for (let i = 0; i < maxFiles; i++) {
      const file = files[i];
      if (!file || file.size === 0) continue;
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const docId = uuid();
      db.prepare(
        `INSERT INTO gs_transaction_docs (id, transaction_id, filename, mime_type, data)
         VALUES (?, ?, ?, ?, ?)`
      ).run(docId, id, file.name, file.type || "application/octet-stream", base64);
    }

    const row = db
      .prepare(
        `SELECT
           t.*,
           c.name  AS category_name,
           c.emoji AS category_emoji,
           (SELECT COUNT(*) FROM gs_transaction_docs d WHERE d.transaction_id = t.id) AS doc_count
         FROM gs_transactions t
         LEFT JOIN gs_acc_categories c ON c.id = t.category_id
         WHERE t.id = ?`
      )
      .get(id);

    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    console.error("[accounting/transactions POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
