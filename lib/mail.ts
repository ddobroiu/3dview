// lib/mail.ts
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendVerificationEmail(to: string, token: string) {
  if (!resend) {
    console.log("Resend not configured, skipping email");
    return;
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/,"") || "http://localhost:3000";
  const url = `${base}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

  await resend.emails.send({
    from: "no-reply@yourdomain.com", // setat în Resend Domain (autentificat)
    to,
    subject: "Confirmă adresa de email",
    html: `
      <div style="font-family:Arial,sans-serif">
        <h2>Confirmă adresa de email</h2>
        <p>Apasă butonul pentru a-ți confirma contul:</p>
        <p><a href="${url}" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#111;color:#fff;text-decoration:none">Confirmă email</a></p>
        <p>Dacă nu funcționează, copiază linkul în browser:<br>${url}</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/,"") || "http://localhost:3000";
  const url = `${base}/reset-password?token=${encodeURIComponent(token)}`;

  await resend.emails.send({
    from: "no-reply@3dview.ai",
    to,
    subject: "Resetează parola",
    html: `
      <div style="font-family:Arial,sans-serif">
        <h2>Resetează parola</h2>
        <p>Apasă butonul pentru a seta o parolă nouă (link valabil 30 de minute):</p>
        <p><a href="${url}" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#111;color:#fff;text-decoration:none">Resetează parola</a></p>
        <p>Dacă nu funcționează, copiază linkul în browser:<br>${url}</p>
      </div>
    `,
  });
}
