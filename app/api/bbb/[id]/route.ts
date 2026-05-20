import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { data, error } = await supabase
    .from("gs_forge")
    .update({
      name: body.name,
      plugin_name: body.pluginName,
      description: body.description,
      author: body.author,
      price: body.price,
      state: body.state,
      licensed: body.licensed,
      obfuscated: body.obfuscated,
      status: body.status,
    })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ...data, pluginName: data.plugin_name });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await supabase.from("gs_forge").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
