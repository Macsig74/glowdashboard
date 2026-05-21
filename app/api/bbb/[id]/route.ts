import { NextRequest, NextResponse } from "next/server";
import { getDb, normalizePlugin } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const db = getDb();
    db.prepare(
      "UPDATE gs_forge SET name=?, plugin_name=?, description=?, author=?, price=?, state=?, licensed=?, obfuscated=?, status=? WHERE id=?"
    ).run(body.name, body.pluginName, body.description ?? null, body.author ?? null, body.price ?? 0, body.state, body.licensed ? 1 : 0, body.obfuscated ? 1 : 0, body.status, params.id);
    const row = db.prepare("SELECT * FROM gs_forge WHERE id = ?").get(params.id) as Record<string, unknown>;
    return NextResponse.json(normalizePlugin(row));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    getDb().prepare("DELETE FROM gs_forge WHERE id = ?").run(params.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
