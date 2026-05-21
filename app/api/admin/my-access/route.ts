import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.isAdmin)
    return NextResponse.json({ salons: ["staff", "servers", "bbb", "admin"] });

  const rows = getDb()
    .prepare("SELECT salon FROM gs_access WHERE username = ?")
    .all(session.user.name ?? "") as { salon: string }[];

  return NextResponse.json({ salons: rows.map((r) => r.salon) });
}
