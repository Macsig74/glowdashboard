import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Staff from "@/lib/models/Staff";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const member = await Staff.findById(params.id);
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(member);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const body = await req.json();
  const member = await Staff.findByIdAndUpdate(params.id, body, { new: true });
  return NextResponse.json(member);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  await Staff.findByIdAndDelete(params.id);
  return NextResponse.json({ success: true });
}
