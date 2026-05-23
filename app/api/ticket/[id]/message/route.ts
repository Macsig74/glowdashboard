import { NextRequest, NextResponse } from "next/server";
import { getDb, uuid } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const ticket = db.prepare("SELECT * FROM gs_tickets WHERE id = ?").get(params.id) as { status: string; username: string } | undefined;
  if (!ticket) return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });
  if (ticket.status === "closed") return NextResponse.json({ error: "Ticket fermé" }, { status: 400 });

  const { message } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "Message vide" }, { status: 400 });

  db.prepare("INSERT INTO gs_ticket_messages (id, ticket_id, sender, message, is_admin) VALUES (?, ?, ?, ?, 0)").run(uuid(), params.id, ticket.username, message.trim());

  const messages = db
    .prepare("SELECT * FROM gs_ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC")
    .all(params.id) as Record<string, unknown>[];

  return NextResponse.json({ messages: messages.map((m) => ({ ...m, is_admin: Boolean(m.is_admin) })) });
}
