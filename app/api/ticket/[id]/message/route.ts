import { NextRequest, NextResponse } from "next/server";
import { getDb, uuid } from "@/lib/db";

interface DbTicket {
  id: string;
  username: string;
  subject: string;
  status: string;
  email: string | null;
  access_code: string | null;
  code_expires_at: string | null;
  created_at: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const code = req.headers.get("x-ticket-code");
  if (!code) {
    return NextResponse.json({ error: "Code requis" }, { status: 401 });
  }

  const db = getDb();
  const ticket = db.prepare("SELECT * FROM gs_tickets WHERE id = ?").get(params.id) as DbTicket | undefined;
  if (!ticket) {
    return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });
  }

  if (!ticket.access_code || ticket.access_code !== code) {
    return NextResponse.json({ error: "Code invalide" }, { status: 403 });
  }
  if (!ticket.code_expires_at || new Date(ticket.code_expires_at) < new Date()) {
    return NextResponse.json({ error: "Code expiré" }, { status: 403 });
  }

  if (ticket.status === "closed") {
    return NextResponse.json({ error: "Ticket fermé" }, { status: 400 });
  }

  const body = await req.json();
  const { message } = body as { message: string };
  if (!message?.trim()) {
    return NextResponse.json({ error: "Message vide" }, { status: 400 });
  }

  const sender = ticket.email ?? ticket.username;

  db.prepare(
    `INSERT INTO gs_ticket_messages (id, ticket_id, sender, message, is_admin)
     VALUES (?, ?, ?, ?, 0)`
  ).run(uuid(), params.id, sender, message.trim());

  const messages = db
    .prepare("SELECT * FROM gs_ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC")
    .all(params.id) as Record<string, unknown>[];

  const shaped = messages.map((m) => ({ ...m, is_admin: Boolean(m.is_admin) }));
  return NextResponse.json({ messages: shaped });
}
