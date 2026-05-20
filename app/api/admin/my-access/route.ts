import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Admins have access to everything
  if (session.user.isAdmin) {
    return NextResponse.json({ salons: ["staff", "servers", "bbb", "admin"] });
  }

  const { data, error } = await supabaseAdmin
    .from("gs_access")
    .select("salon")
    .eq("username", session.user.name ?? "");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const salons = (data ?? []).map((r: { salon: string }) => r.salon);
  return NextResponse.json({ salons });
}
