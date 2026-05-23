import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const ticket = db.prepare("SELECT * FROM gs_tickets WHERE id = ?").get(params.id);
  if (!ticket) return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });

  const messages = db
    .prepare("SELECT * FROM gs_ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC")
    .all(params.id) as Record<string, unknown>[];

  return NextResponse.json({ ...ticket, messages: messages.map((m) => ({ ...m, is_admin: Boolean(m.is_admin) })) });
}
