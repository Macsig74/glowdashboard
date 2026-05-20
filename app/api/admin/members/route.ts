import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

function adminOnly(session: Session | null) {
  if (!session?.user?.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const deny = adminOnly(session);
  if (deny) return deny;

  const { data, error } = await supabase
    .from("gs_phantom")
    .select("id, username, created_at")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const deny = adminOnly(session);
  if (deny) return deny;

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
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
