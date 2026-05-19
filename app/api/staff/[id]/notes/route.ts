import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Staff from "@/lib/models/Staff";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const note = await req.json();
  const member = await Staff.findById(params.id);
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  member.notes.push({ ...note, createdAt: new Date() });

  const scoreChange = note.type === "good" ? note.weight : -note.weight;
  member.score = Math.max(0, member.score + scoreChange);

  await member.save();
  return NextResponse.json(member);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const { noteId } = await req.json();
  const member = await Staff.findById(params.id);
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const note = member.notes.find((n: { _id: { toString: () => string } }) => n._id.toString() === noteId);
  if (note) {
    const scoreChange = note.type === "good" ? -note.weight : note.weight;
    member.score = Math.max(0, member.score + scoreChange);
    member.notes = member.notes.filter((n: { _id: { toString: () => string } }) => n._id.toString() !== noteId);
  }

  await member.save();
  return NextResponse.json(member);
}
