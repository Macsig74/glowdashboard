import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb, uuid, getAllServers, getServersForUser } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.isAdmin) {
    return NextResponse.json(getAllServers());
  }

  const username = session.user.name ?? "";
  return NextResponse.json(getServersForUser(username));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
