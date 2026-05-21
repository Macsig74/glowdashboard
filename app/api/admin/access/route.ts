import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb, uuid } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(getDb().prepare("SELECT * FROM gs_access").all() ?? []);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { username, salon } = await req.json();
  if (!username || !salon)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const db = getDb();
  const existing = db.prepare("SELECT id FROM gs_access WHERE username = ? AND salon = ?").get(username, salon);
  if (!existing)
    db.prepare("INSERT INTO gs_access (id, username, salon) VALUES (?, ?, ?)").run(uuid(), username, salon);

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { username, salon } = await req.json();
  if (!username || !salon)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  getDb().prepare("DELETE FROM gs_access WHERE username = ? AND salon = ?").run(username, salon);
  return NextResponse.json({ success: true });
}
