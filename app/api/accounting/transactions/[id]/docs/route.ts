import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const docId = searchParams.get("docId");

    if (!docId) {
      return NextResponse.json({ error: "docId query param required" }, { status: 400 });
    }

    const db = getDb();
    const doc = db
      .prepare(
        "SELECT * FROM gs_transaction_docs WHERE id = ? AND transaction_id = ?"
      )
      .get(docId, params.id) as
      | { id: string; filename: string; mime_type: string; data: string }
      | undefined;

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const binary = Buffer.from(doc.data, "base64");
    return new Response(binary, {
      headers: {
        "Content-Type": doc.mime_type,
        "Content-Disposition": `attachment; filename="${doc.filename}"`,
        "Content-Length": binary.length.toString(),
      },
    });
  } catch (err) {
    console.error("[accounting/transactions/docs GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const docs = db
      .prepare(
        "SELECT id, filename, mime_type, created_at FROM gs_transaction_docs WHERE transaction_id = ? ORDER BY created_at ASC"
      )
      .all(params.id);
    return NextResponse.json(docs);
  } catch (err) {
    console.error("[accounting/transactions/docs POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
