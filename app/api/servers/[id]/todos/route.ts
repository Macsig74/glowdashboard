import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

async function getServer(id: string) {
  const { data } = await supabase
    .from("gs_cluster")
    .select("*, gs_items(*)")
    .eq("id", id)
    .single();
  return data;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { text } = await req.json();
  const { error } = await supabase.from("gs_items").insert({ server_id: params.id, text, done: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(await getServer(params.id));
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { todoId, done } = await req.json();
  const { error } = await supabase.from("gs_items").update({ done }).eq("id", todoId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(await getServer(params.id));
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { todoId } = await req.json();
  const { error } = await supabase.from("gs_items").delete().eq("id", todoId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(await getServer(params.id));
}
