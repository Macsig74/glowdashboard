import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb, uuid } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const db = getDb();
    const existing = db.prepare("SELECT id FROM gs_phantom WHERE username = ?").get(username);
    if (existing)
      return NextResponse.json({ error: "User already exists" }, { status: 409 });

    const hashed = await bcrypt.hash(password, 10);
    db.prepare("INSERT INTO gs_phantom (id, username, password) VALUES (?, ?, ?)").run(uuid(), username, hashed);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Server error", detail: String(err) }, { status: 500 });
  }
}
