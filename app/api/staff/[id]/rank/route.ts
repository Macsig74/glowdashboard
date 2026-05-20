import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { action, newRole } = await req.json();

  const { data: member } = await supabase
    .from("gs_roster")
    .select("role")
    .eq("id", params.id)
    .single();

  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await supabase.from("gs_ledger").insert({
    staff_id: params.id,
    action,
    old_role: member.role,
  });

  await supabase.from("gs_roster").update({ role: newRole }).eq("id", params.id);

  const { data: updated } = await supabase
    .from("gs_roster")
    .select("*, gs_ticker(*), gs_ledger(*)")
    .eq("id", params.id)
    .single();

  return NextResponse.json(updated);
}
