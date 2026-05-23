import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const result = db
      .prepare("DELETE FROM gs_transactions WHERE id = ?")
      .run(params.id);
    if (result.changes === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[accounting/transactions DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
