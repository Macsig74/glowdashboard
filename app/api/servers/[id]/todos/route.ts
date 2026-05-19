import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Server from "@/lib/models/Server";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const { text } = await req.json();
  const server = await Server.findById(params.id);
  if (!server) return NextResponse.json({ error: "Not found" }, { status: 404 });
  server.todoList.push({ text, done: false, createdAt: new Date() });
  await server.save();
  return NextResponse.json(server);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const { todoId, done } = await req.json();
  const server = await Server.findById(params.id);
  if (!server) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const todo = server.todoList.find((t: { _id: { toString: () => string } }) => t._id.toString() === todoId);
  if (todo) todo.done = done;
  await server.save();
  return NextResponse.json(server);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const { todoId } = await req.json();
  const server = await Server.findById(params.id);
  if (!server) return NextResponse.json({ error: "Not found" }, { status: 404 });
  server.todoList = server.todoList.filter((t: { _id: { toString: () => string } }) => t._id.toString() !== todoId);
  await server.save();
  return NextResponse.json(server);
}
