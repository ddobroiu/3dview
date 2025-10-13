// pages/api/auth/reset-password.ts
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { prisma } from "../../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ error: "Date invalide" });

  const prt = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!prt) return res.status(400).json({ error: "Token invalid" });
  if (prt.expires < new Date()) return res.status(400).json({ error: "Token expirat" });

  const user = await prisma.user.findUnique({ where: { email: prt.identifier } });
  if (!user) return res.status(404).json({ error: "Utilizator inexistent" });

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  // consumă token
  await prisma.passwordResetToken.delete({ where: { token } });

  return res.status(200).json({ ok: true });
}
