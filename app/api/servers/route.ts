import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Server from "@/lib/models/Server";

export async function GET() {
  await connectDB();
  const servers = await Server.find().sort({ createdAt: -1 });
  return NextResponse.json(servers);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await connectDB();
    const server = await Server.create(body);
    return NextResponse.json(server, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
