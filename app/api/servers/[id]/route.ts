import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Server from "@/lib/models/Server";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const body = await req.json();
  const server = await Server.findByIdAndUpdate(params.id, body, { new: true });
  return NextResponse.json(server);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  await Server.findByIdAndDelete(params.id);
  return NextResponse.json({ success: true });
}
