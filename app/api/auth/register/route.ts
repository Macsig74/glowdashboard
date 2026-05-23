import { NextResponse } from "next/server";

// Disabled — use /api/register (admin-only)
export async function POST() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
