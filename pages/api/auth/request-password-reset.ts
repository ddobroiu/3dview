// pages/api/auth/request-password-reset.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/db";
import { v4 as uuidv4 } from "uuid";
import { sendPasswordResetEmail } from "../../../lib/mail";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "Email obligatoriu" });

  const user = await prisma.user.findUnique({ where: { email } });
  // răspuns generic pentru a nu dezvălui existența
  if (!user) return res.status(200).json({ ok: true });

  const token = uuidv4();
  const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 min
  await prisma.passwordResetToken.create({
    data: { identifier: email, token, expires },
  });

  await sendPasswordResetEmail(email, token);

  return res.status(200).json({ ok: true });
}
