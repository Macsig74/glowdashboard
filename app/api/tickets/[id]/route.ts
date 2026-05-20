import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// GET — get ticket + messages (public by ticket ID)
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data: ticket, error: ticketError } = await supabase
    .from("gs_tickets")
    .select("*")
    .eq("id", params.id)
    .single();

  if (ticketError || !ticket)
    return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });

  const { data: messages, error: msgError } = await supabase
    .from("gs_ticket_messages")
    .select("*")
    .eq("ticket_id", params.id)
    .order("created_at", { ascending: true });

  if (msgError) return NextResponse.json({ error: msgError.message }, { status: 500 });

  return NextResponse.json({ ...ticket, messages: messages ?? [] });
}

// PATCH — update ticket status (admin only)
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

  const { error } = await supabase
    .from("gs_tickets")
    .update({ status })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
