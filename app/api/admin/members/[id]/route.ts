import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isAdmin } from "@/lib/admins";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getDb();
  const user = db.prepare("SELECT username FROM gs_phantom WHERE id = ?").get(params.id) as { username: string } | undefined;

  if (user && isAdmin(user.username))
    return NextResponse.json({ error: "Cannot delete admin accounts" }, { status: 403 });

  db.prepare("DELETE FROM gs_phantom WHERE id = ?").run(params.id);
  if (user) db.prepare("DELETE FROM gs_access WHERE username = ?").run(user.username);

  return NextResponse.json({ success: true });
}
