import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// GET — list all tickets (admin only)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabase
    .from("gs_tickets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST — create a ticket (public, no auth required)
export async function POST(req: NextRequest) {
  const { username, subject, message } = await req.json();
  if (!username || !subject || !message)
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });

  const { data: ticket, error: ticketError } = await supabase
    .from("gs_tickets")
    .insert({ username, subject, status: "open" })
    .select()
    .single();

  if (ticketError) return NextResponse.json({ error: ticketError.message }, { status: 500 });

  const { error: msgError } = await supabase
    .from("gs_ticket_messages")
    .insert({ ticket_id: ticket.id, sender: username, message, is_admin: false });

  if (msgError) return NextResponse.json({ error: msgError.message }, { status: 500 });

  return NextResponse.json({ id: ticket.id });
}
