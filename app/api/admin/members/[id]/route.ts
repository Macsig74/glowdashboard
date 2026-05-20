import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { isAdmin } from "@/lib/admins";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: user } = await supabase
    .from("gs_phantom")
    .select("username")
    .eq("id", params.id)
    .single();

  if (user && isAdmin(user.username))
    return NextResponse.json({ error: "Cannot delete admin accounts" }, { status: 403 });

  const { error } = await supabase.from("gs_phantom").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("gs_access").delete().eq("username", user?.username ?? "");

  return NextResponse.json({ success: true });
}
