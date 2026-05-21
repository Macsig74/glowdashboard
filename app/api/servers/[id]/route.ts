import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    getDb().prepare("DELETE FROM gs_cluster WHERE id = ?").run(params.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const db = getDb();
    const fields = Object.keys(body).map((k) => `${k} = ?`).join(", ");
    db.prepare(`UPDATE gs_cluster SET ${fields} WHERE id = ?`).run(...Object.values(body), params.id);
    const updated = db.prepare("SELECT * FROM gs_cluster WHERE id = ?").get(params.id);
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
