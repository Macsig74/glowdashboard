import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("gs_forge")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, error } = await supabase
      .from("gs_forge")
      .insert({
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
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(normalizePlugin(data), { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

function normalizePlugin(p: Record<string, unknown>) {
  return { ...p, pluginName: p.plugin_name };
}
