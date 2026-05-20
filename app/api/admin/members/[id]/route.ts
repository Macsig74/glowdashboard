import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdmin } from "@/lib/admins";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Prevent deleting admin accounts
  const { data: user } = await supabaseAdmin
    .from("gs_phantom")
    .select("username")
    .eq("id", params.id)
    .single();

  if (user && isAdmin(user.username))
    return NextResponse.json({ error: "Cannot delete admin accounts" }, { status: 403 });

  const { error } = await supabaseAdmin.from("gs_phantom").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Also remove their access entries
  await supabaseAdmin.from("gs_access").delete().eq("username", user?.username ?? "");

  return NextResponse.json({ success: true });
}
