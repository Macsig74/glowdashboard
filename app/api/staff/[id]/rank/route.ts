import { NextRequest, NextResponse } from "next/server";
import { getDb, uuid, getStaffWithRelations } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { action, newRole } = await req.json();
    const db = getDb();

    const member = db.prepare("SELECT role FROM gs_roster WHERE id = ?").get(params.id) as { role: string } | undefined;
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

    db.prepare("INSERT INTO gs_ledger (id, staff_id, action, old_role) VALUES (?, ?, ?, ?)").run(uuid(), params.id, action, member.role);
    db.prepare("UPDATE gs_roster SET role = ? WHERE id = ?").run(newRole, params.id);

    return NextResponse.json(getStaffWithRelations(params.id));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
