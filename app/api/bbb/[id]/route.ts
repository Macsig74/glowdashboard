import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Plugin from "@/lib/models/Plugin";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const body = await req.json();
  const plugin = await Plugin.findByIdAndUpdate(params.id, body, { new: true });
  return NextResponse.json(plugin);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  await Plugin.findByIdAndDelete(params.id);
  return NextResponse.json({ success: true });
}
