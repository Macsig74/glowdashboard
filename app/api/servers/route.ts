import { NextRequest, NextResponse } from "next/server";
import { getDb, uuid, getAllServers } from "@/lib/db";

export async function GET() {
  return NextResponse.json(getAllServers());
}

export async function POST(req: NextRequest) {
  try {
    const { name, description } = await req.json();
    const db = getDb();
    const id = uuid();
    db.prepare("INSERT INTO gs_cluster (id, name, description) VALUES (?, ?, ?)").run(id, name, description ?? null);
    return NextResponse.json({ id, name, description: description ?? null, gs_items: [] }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
