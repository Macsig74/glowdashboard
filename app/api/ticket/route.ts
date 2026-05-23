import { NextRequest, NextResponse } from "next/server";
import { getDb, uuid } from "@/lib/db";
import { sendMail } from "@/lib/mail";

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, subject, message } = body as Record<string, string>;

    if (!email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const ticketId = uuid();
    const db = getDb();

    db.prepare(
      `INSERT INTO gs_tickets (id, username, subject, status, email, access_code, code_expires_at)
       VALUES (?, ?, ?, 'open', ?, ?, ?)`
    ).run(ticketId, email.trim(), subject.trim(), email.trim(), code, expiresAt);

    db.prepare(
      `INSERT INTO gs_ticket_messages (id, ticket_id, sender, message, is_admin)
       VALUES (?, ?, ?, ?, 0)`
    ).run(uuid(), ticketId, email.trim(), message.trim());

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3005";
    const ticketUrl = `${baseUrl}/ticket/${ticketId}`;

    await sendMail({
      to: email.trim(),
      subject: "Votre ticket GlowStudio",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #1a1a1a; color: #f5f5f5; border-radius: 12px; padding: 32px;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
            <div style="background: #f59e0b; border-radius: 8px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 18px;">⚡</div>
            <span style="font-weight: 700; font-size: 20px;">GlowStudio</span>
          </div>
          <h2 style="margin: 0 0 8px; font-size: 18px;">Votre ticket a été créé</h2>
          <p style="color: #a1a1aa; margin: 0 0 24px; font-size: 14px;">Sujet : <strong style="color: #f5f5f5;">${subject.trim()}</strong></p>
          <div style="background: #2a2a2a; border: 1px solid #3a3a3a; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <p style="margin: 0 0 8px; font-size: 13px; color: #a1a1aa;">Votre code d'accès</p>
            <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #f59e0b;">${code}</div>
            <p style="margin: 12px 0 0; font-size: 12px; color: #71717a;">Valide 30 minutes</p>
          </div>
          <a href="${ticketUrl}" style="display: block; background: #f59e0b; color: #000; text-align: center; padding: 12px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">Accéder à mon ticket</a>
          <p style="margin: 20px 0 0; font-size: 12px; color: #52525b; text-align: center;">Si vous n'avez pas créé ce ticket, ignorez cet email.</p>
        </div>
      `,
    });

    console.log(`[ticket] New ticket ${ticketId} for ${email}, code: ${code}`);

    return NextResponse.json({ id: ticketId, email: email.trim() }, { status: 201 });
  } catch (err) {
    console.error("[ticket] POST error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
