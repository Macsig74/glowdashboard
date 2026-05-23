import { NextRequest, NextResponse } from "next/server";
import { getDb, uuid } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { username, subject, message } = await req.json();
    if (!username?.trim() || !subject?.trim() || !message?.trim())
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });

    const db = getDb();
    const ticketId = uuid();
    db.prepare("INSERT INTO gs_tickets (id, username, subject, status) VALUES (?, ?, ?, 'open')").run(ticketId, username.trim(), subject.trim());
    db.prepare("INSERT INTO gs_ticket_messages (id, ticket_id, sender, message, is_admin) VALUES (?, ?, ?, ?, 0)").run(uuid(), ticketId, username.trim(), message.trim());

    return NextResponse.json({ id: ticketId }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
