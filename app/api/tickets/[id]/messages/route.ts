import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb, uuid } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { message } = await req.json();
  if (!message?.trim())
    return NextResponse.json({ error: "Message vide" }, { status: 400 });

  const db = getDb();
  db.prepare("INSERT INTO gs_ticket_messages (id, ticket_id, sender, message, is_admin) VALUES (?, ?, ?, ?, 1)").run(
    uuid(), params.id, session.user.name ?? "Admin", message.trim()
  );

  // Auto set in_progress if still open
  db.prepare("UPDATE gs_tickets SET status = 'in_progress' WHERE id = ? AND status = 'open'").run(params.id);

  return NextResponse.json({ success: true });
}
