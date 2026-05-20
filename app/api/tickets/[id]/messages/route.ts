import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

// POST — add a message to a ticket (admin only)
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

  const { error } = await supabase.from("gs_ticket_messages").insert({
    ticket_id: params.id,
    sender: session.user.name ?? "Admin",
    message: message.trim(),
    is_admin: true,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto set status to in_progress if still open
  await supabase
    .from("gs_tickets")
    .update({ status: "in_progress" })
    .eq("id", params.id)
    .eq("status", "open");

  return NextResponse.json({ success: true });
}
