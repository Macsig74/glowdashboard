import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const { data: existing } = await supabase
      .from("gs_phantom")
      .select("id")
      .eq("username", username)
      .single();

    if (existing)
      return NextResponse.json({ error: "User already exists" }, { status: 409 });

    const hashed = await bcrypt.hash(password, 10);
    const { error } = await supabase.from("gs_phantom").insert({ username, password: hashed });
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Server error", detail: String(err) }, { status: 500 });
  }
}
