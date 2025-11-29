// pages/api/auth/register.ts
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { prisma } from "../../../lib/db";
import { v4 as uuidv4 } from "uuid";
import { sendVerificationEmail } from "../../../lib/mail";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  console.log("Register API called with body:", req.body);

  try {
    const { username, email, password } = req.body || {};
    console.log("Extracted data:", { username, email, password: password ? "***" : undefined });
    
    if (!username || !email || !password) {
      console.log("Missing required fields");
      return res.status(400).json({ error: "Toate câmpurile sunt obligatorii" });
    }

    console.log("Checking if user exists...");
    const exists = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
      select: { id: true },
    });
    console.log("User exists check result:", exists);
    
    if (exists) return res.status(409).json({ error: "Utilizatorul sau emailul există deja" });

    console.log("Hashing password...");
    const passwordHash = await bcrypt.hash(password, 12);
    console.log("Password hashed successfully");

    console.log("Creating user in database...");
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
      },
    });
    console.log("User created successfully:", { id: user.id, username: user.username });

    // Încearcă să trimită email de verificare (opțional)
    try {
      const token = uuidv4();
      const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
      await prisma.verificationToken.create({
        data: {
          identifier: user.email,
          token,
          expires,
        },
      });

      if (process.env.RESEND_API_KEY) {
        await sendVerificationEmail(user.email, token);
      }
    } catch (emailError) {
      console.log("Email sending failed:", emailError);
      // Continuă fără să blocheze înregistrarea
    }

    console.log("Registration completed successfully");
    return res.status(201).json({ ok: true, message: "Cont creat. Verifică emailul pentru confirmare." });
  } catch (e: any) {
    console.error("Register API error:", e);
    return res.status(500).json({ error: "Eroare server", details: e?.message });
  }
}
