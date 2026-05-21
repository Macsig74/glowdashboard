import { NextRequest, NextResponse } from "next/server";
import { getDb, getStaffWithRelations } from "@/lib/db";

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    getDb().prepare("DELETE FROM gs_roster WHERE id = ?").run(params.id);
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
    db.prepare(`UPDATE gs_roster SET ${fields} WHERE id = ?`).run(...Object.values(body), params.id);
    return NextResponse.json(getStaffWithRelations(params.id));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
