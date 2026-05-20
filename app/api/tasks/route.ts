import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");

  if (!username) return NextResponse.json([]);

  const { data, error } = await supabase
    .from("gs_items")
    .select("*, gs_cluster(id, name)")
    .eq("assigned_to", username)
    .eq("done", false)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
