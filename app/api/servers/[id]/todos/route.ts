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
  const { text, description, priority, due_date, assigned_to } = await req.json();
  const { error } = await supabase.from("gs_items").insert({
    server_id: params.id,
    text,
    description: description || null,
    priority: priority || "medium",
    due_date: due_date || null,
    assigned_to: assigned_to || null,
    done: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(await getServer(params.id));
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { todoId, done, text, description, priority, due_date, assigned_to } = await req.json();
  const updates: Record<string, unknown> = {};
  if (done !== undefined) updates.done = done;
  if (text !== undefined) updates.text = text;
  if (description !== undefined) updates.description = description || null;
  if (priority !== undefined) updates.priority = priority;
  if (due_date !== undefined) updates.due_date = due_date || null;
  if (assigned_to !== undefined) updates.assigned_to = assigned_to || null;

  const { error } = await supabase.from("gs_items").update(updates).eq("id", todoId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(await getServer(params.id));
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { todoId } = await req.json();
  const { error } = await supabase.from("gs_items").delete().eq("id", todoId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(await getServer(params.id));
}
