import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb, uuid } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const perms = getDb().prepare("SELECT * FROM gs_server_perms ORDER BY username ASC").all();
  return NextResponse.json(perms ?? []);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { username, server_id } = await req.json() as { username: string; server_id: string };
  if (!username?.trim() || !server_id?.trim()) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  try {
    const db = getDb();
    const id = uuid();
    db.prepare(
      "INSERT INTO gs_server_perms (id, username, server_id) VALUES (?, ?, ?)"
    ).run(id, username.trim(), server_id.trim());
    return NextResponse.json({ id, username: username.trim(), server_id: server_id.trim() }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("UNIQUE")) {
      return NextResponse.json({ error: "Permission déjà accordée" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { username, server_id } = await req.json() as { username: string; server_id: string };
  if (!username?.trim() || !server_id?.trim()) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  getDb()
    .prepare("DELETE FROM gs_server_perms WHERE username = ? AND server_id = ?")
    .run(username.trim(), server_id.trim());

  return NextResponse.json({ success: true });
}
