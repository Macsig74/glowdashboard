import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Plugin from "@/lib/models/Plugin";

export async function GET() {
  await connectDB();
  const plugins = await Plugin.find().sort({ createdAt: -1 });
  return NextResponse.json(plugins);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await connectDB();
    const plugin = await Plugin.create(body);
    return NextResponse.json(plugin, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
