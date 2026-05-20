import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const note = await req.json();

  const { error: noteError } = await supabase.from("gs_ticker").insert({
    staff_id: params.id,
    content: note.content,
    type: note.type,
    weight: note.weight,
    created_by: note.createdBy,
  });
  if (noteError) return NextResponse.json({ error: noteError.message }, { status: 500 });

  const { data: member } = await supabase
    .from("gs_roster")
    .select("score")
    .eq("id", params.id)
    .single();

  const current = member?.score ?? 0;
  const delta = note.type === "good" ? note.weight : -note.weight;
  const newScore = Math.max(0, current + delta);

  await supabase.from("gs_roster").update({ score: newScore }).eq("id", params.id);

  const { data: updated } = await supabase
    .from("gs_roster")
    .select("*, gs_ticker(*), gs_ledger(*)")
    .eq("id", params.id)
    .single();

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { noteId } = await req.json();

  const { data: note } = await supabase
    .from("gs_ticker")
    .select("type, weight")
    .eq("id", noteId)
    .single();

  if (note) {
    const { data: member } = await supabase
      .from("gs_roster")
      .select("score")
      .eq("id", params.id)
      .single();

    const current = member?.score ?? 0;
    const delta = note.type === "good" ? -note.weight : note.weight;
    const newScore = Math.max(0, current + delta);

    await supabase.from("gs_roster").update({ score: newScore }).eq("id", params.id);
    await supabase.from("gs_ticker").delete().eq("id", noteId);
  }

  const { data: updated } = await supabase
    .from("gs_roster")
    .select("*, gs_ticker(*), gs_ledger(*)")
    .eq("id", params.id)
    .single();

  return NextResponse.json(updated);
}
