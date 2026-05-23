import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

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

function validateCode(ticket: DbTicket, code: string): { valid: boolean; error?: string } {
  if (!ticket.access_code || ticket.access_code !== code) {
    return { valid: false, error: "Code invalide" };
  }
  if (!ticket.code_expires_at || new Date(ticket.code_expires_at) < new Date()) {
    return { valid: false, error: "Code expiré" };
  }
  return { valid: true };
}

export async function GET(
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

  const { valid, error } = validateCode(ticket, code);
  if (!valid) {
    return NextResponse.json({ error }, { status: 403 });
  }

  const messages = db
    .prepare("SELECT * FROM gs_ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC")
    .all(params.id) as Record<string, unknown>[];

  const shaped = messages.map((m) => ({ ...m, is_admin: Boolean(m.is_admin) }));

  // Don't expose the access code in the response
  const { access_code: _code, code_expires_at: _exp, ...safeTicket } = ticket;

  return NextResponse.json({ ...safeTicket, messages: shaped });
}
