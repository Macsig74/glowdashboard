import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { getDb, uuid } from "@/lib/db";

function adminOnly(session: Session | null) {
  if (!session?.user?.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const deny = adminOnly(session);
  if (deny) return deny;

  const data = getDb().prepare("SELECT id, username, created_at FROM gs_phantom ORDER BY created_at ASC").all();
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const deny = adminOnly(session);
  if (deny) return deny;

  const { username, password } = await req.json();
  if (!username || !password)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const db = getDb();
  const existing = db.prepare("SELECT id FROM gs_phantom WHERE username = ?").get(username);
  if (existing) return NextResponse.json({ error: "User already exists" }, { status: 409 });

  const hashed = await bcrypt.hash(password, 10);
  db.prepare("INSERT INTO gs_phantom (id, username, password) VALUES (?, ?, ?)").run(uuid(), username, hashed);
  return NextResponse.json({ success: true });
}
