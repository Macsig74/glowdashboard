import { NextRequest, NextResponse } from "next/server";
import { getDb, uuid, getServerWithItems } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { text, description, priority, due_date, assigned_to } = await req.json();
    const db = getDb();
    db.prepare(
      "INSERT INTO gs_items (id, server_id, text, description, priority, due_date, assigned_to, done) VALUES (?, ?, ?, ?, ?, ?, ?, 0)"
    ).run(uuid(), params.id, text, description || null, priority || "medium", due_date || null, assigned_to || null);
    return NextResponse.json(getServerWithItems(params.id));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { todoId, done, text, description, priority, due_date, assigned_to } = await req.json();
    const db = getDb();
    const updates: Record<string, unknown> = {};
    if (done !== undefined)        updates.done        = done ? 1 : 0;
    if (text !== undefined)        updates.text        = text;
    if (description !== undefined) updates.description = description || null;
    if (priority !== undefined)    updates.priority    = priority;
    if (due_date !== undefined)    updates.due_date    = due_date || null;
    if (assigned_to !== undefined) updates.assigned_to = assigned_to || null;
    const fields = Object.keys(updates).map((k) => `${k} = ?`).join(", ");
    db.prepare(`UPDATE gs_items SET ${fields} WHERE id = ?`).run(...Object.values(updates), todoId);
    return NextResponse.json(getServerWithItems(params.id));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { todoId } = await req.json();
    getDb().prepare("DELETE FROM gs_items WHERE id = ?").run(todoId);
    return NextResponse.json(getServerWithItems(params.id));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
