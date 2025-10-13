// pages/api/auth/register.ts
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { prisma } from "../../../lib/db";
import { v4 as uuidv4 } from "uuid";
import { sendVerificationEmail } from "../../../lib/mail";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) return res.status(400).json({ error: "Toate câmpurile sunt obligatorii" });

    const exists = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
      select: { id: true },
    });
    if (exists) return res.status(409).json({ error: "Utilizatorul sau emailul există deja" });

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
      },
    });

    // creează token verificare email
    const token = uuidv4();
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token,
        expires,
      },
    });

    await sendVerificationEmail(user.email, token);

    return res.status(201).json({ ok: true, message: "Cont creat. Verifică emailul pentru confirmare." });
  } catch (e: any) {
    return res.status(500).json({ error: "Eroare server", details: e?.message });
  }
}
