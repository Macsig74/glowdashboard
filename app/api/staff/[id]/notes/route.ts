import { NextRequest, NextResponse } from "next/server";
import { getDb, uuid, getStaffWithRelations } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const note = await req.json();
    const db = getDb();

    db.prepare(
      "INSERT INTO gs_ticker (id, staff_id, content, type, weight, created_by) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(uuid(), params.id, note.content, note.type, note.weight, note.createdBy ?? null);

    const member = db.prepare("SELECT score FROM gs_roster WHERE id = ?").get(params.id) as { score: number } | undefined;
    const current = member?.score ?? 0;
    const delta = note.type === "good" ? note.weight : -note.weight;
    const newScore = Math.max(0, current + delta);
    db.prepare("UPDATE gs_roster SET score = ? WHERE id = ?").run(newScore, params.id);

    return NextResponse.json(getStaffWithRelations(params.id));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { noteId } = await req.json();
    const db = getDb();

    const note = db.prepare("SELECT type, weight FROM gs_ticker WHERE id = ?").get(noteId) as { type: string; weight: number } | undefined;
    if (note) {
      const member = db.prepare("SELECT score FROM gs_roster WHERE id = ?").get(params.id) as { score: number } | undefined;
      const current = member?.score ?? 0;
      const delta = note.type === "good" ? -note.weight : note.weight;
      const newScore = Math.max(0, current + delta);
      db.prepare("UPDATE gs_roster SET score = ? WHERE id = ?").run(newScore, params.id);
      db.prepare("DELETE FROM gs_ticker WHERE id = ?").run(noteId);
    }

    return NextResponse.json(getStaffWithRelations(params.id));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
