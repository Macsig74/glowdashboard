import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb, uuid } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(getDb().prepare("SELECT * FROM gs_tickets ORDER BY created_at DESC").all() ?? []);
}

export async function POST(req: NextRequest) {
  const { username, subject, message } = await req.json();
  if (!username || !subject || !message)
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });

  const db = getDb();
  const ticketId = uuid();
  db.prepare("INSERT INTO gs_tickets (id, username, subject, status) VALUES (?, ?, ?, 'open')").run(ticketId, username, subject);
  db.prepare("INSERT INTO gs_ticket_messages (id, ticket_id, sender, message, is_admin) VALUES (?, ?, ?, ?, 0)").run(uuid(), ticketId, username, message);

  return NextResponse.json({ id: ticketId });
}
