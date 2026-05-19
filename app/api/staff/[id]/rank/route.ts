import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Staff from "@/lib/models/Staff";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const { action, newRole } = await req.json();
  const member = await Staff.findById(params.id);
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  member.rankHistory.push({ action, role: member.role, date: new Date() });
  member.role = newRole;
  await member.save();
  return NextResponse.json(member);
}
