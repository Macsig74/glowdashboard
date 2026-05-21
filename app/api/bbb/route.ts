import { NextRequest, NextResponse } from "next/server";
import { getDb, uuid, normalizePlugin } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const data = db.prepare("SELECT * FROM gs_forge ORDER BY created_at DESC").all() as Record<string, unknown>[];
  return NextResponse.json(data.map(normalizePlugin));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = getDb();
    const id = uuid();
    db.prepare(
      "INSERT INTO gs_forge (id, name, plugin_name, description, author, price, state, licensed, obfuscated, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(id, body.name, body.pluginName, body.description ?? null, body.author ?? null, body.price ?? 0, body.state ?? "not_started", body.licensed ? 1 : 0, body.obfuscated ? 1 : 0, body.status ?? "not_ready");
    const row = db.prepare("SELECT * FROM gs_forge WHERE id = ?").get(id) as Record<string, unknown>;
    return NextResponse.json(normalizePlugin(row), { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
