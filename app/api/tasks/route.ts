import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");
  if (!username) return NextResponse.json([]);

  const data = getDb().prepare(`
    SELECT gi.*, gc.id AS cluster_id, gc.name AS cluster_name
    FROM gs_items gi
    LEFT JOIN gs_cluster gc ON gc.id = gi.server_id
    WHERE gi.assigned_to = ? AND gi.done = 0
    ORDER BY gi.created_at DESC
  `).all(username) as Record<string, unknown>[];

  // Shape to match the original { gs_cluster: { id, name } } structure
  const shaped = data.map(({ cluster_id, cluster_name, ...rest }) => ({
    ...rest,
    gs_cluster: { id: cluster_id, name: cluster_name },
  }));

  return NextResponse.json(shaped);
}
