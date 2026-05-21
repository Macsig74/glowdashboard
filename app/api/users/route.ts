import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const data = getDb().prepare("SELECT id, username FROM gs_phantom ORDER BY username ASC").all();
  return NextResponse.json(data ?? []);
}
