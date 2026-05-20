import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabaseAdmin.from("gs_access").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { username, salon } = await req.json();
  if (!username || !salon)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("gs_access")
    .upsert({ username, salon }, { onConflict: "username,salon" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { username, salon } = await req.json();
  if (!username || !salon)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("gs_access")
    .delete()
    .eq("username", username)
    .eq("salon", salon);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
