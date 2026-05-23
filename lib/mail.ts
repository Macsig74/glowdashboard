import nodemailer from "nodemailer";

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !port || !user || !pass || !from) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendMail({ to, subject, html }: MailOptions): Promise<void> {
  const from = process.env.SMTP_FROM;
  const transporter = getTransporter();

  if (!transporter || !from) {
    console.warn("[mail] SMTP not configured — skipping email send.");
    console.log(`[mail] Would have sent to ${to}: ${subject}`);
    console.log(`[mail] HTML content:\n${html}`);
    return;
  }

  await transporter.sendMail({ from, to, subject, html });
}
