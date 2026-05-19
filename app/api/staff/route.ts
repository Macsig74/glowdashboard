import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Staff from "@/lib/models/Staff";

export async function GET() {
  await connectDB();
  const staff = await Staff.find().sort({ createdAt: -1 });
  return NextResponse.json(staff);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await connectDB();
    const member = await Staff.create(body);
    return NextResponse.json(member, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
