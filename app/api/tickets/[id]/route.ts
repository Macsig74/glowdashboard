import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const db = getDb();
  const ticket = db.prepare("SELECT * FROM gs_tickets WHERE id = ?").get(params.id);
  if (!ticket) return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });

  const messages = db.prepare("SELECT * FROM gs_ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC").all(params.id) as Record<string, unknown>[];
  const shaped = messages.map((m) => ({ ...m, is_admin: Boolean(m.is_admin) }));
  return NextResponse.json({ ...ticket, messages: shaped });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { status } = await req.json();
  if (!["open", "in_progress", "closed"].includes(status))
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });

  getDb().prepare("UPDATE gs_tickets SET status = ? WHERE id = ?").run(status, params.id);
  return NextResponse.json({ success: true });
}
