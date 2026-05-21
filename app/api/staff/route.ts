import { NextRequest, NextResponse } from "next/server";
import { getDb, uuid, getAllStaff } from "@/lib/db";

export async function GET() {
  return NextResponse.json(getAllStaff());
}

export async function POST(req: NextRequest) {
  try {
    const { username, role } = await req.json();
    const db = getDb();
    const id = uuid();
    db.prepare("INSERT INTO gs_roster (id, username, role, score) VALUES (?, ?, ?, 0)").run(id, username, role);
    return NextResponse.json({ id, username, role, score: 0, gs_ticker: [], gs_ledger: [] }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
