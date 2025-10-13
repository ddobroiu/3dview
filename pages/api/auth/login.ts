// pages/api/auth/login.ts
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import cookie from "cookie";
import { prisma } from "../../../lib/db";
import { signToken } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { username, email, password } = req.body || {};
    if ((!username && !email) || !password) {
      return res.status(400).json({ error: "Completează utilizator/email și parola" });
    }

    const user = await prisma.user.findFirst({
      where: { OR: [{ username: username || "" }, { email: email || "" }] },
    });
    if (!user) return res.status(401).json({ error: "Date de autentificare invalide" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Date de autentificare invalide" });

    if (!user.emailVerified) {
      return res.status(403).json({ error: "Emailul nu este verificat. Verifică inbox-ul." });
    }

    const token = signToken({ id: user.id, username: user.username, email: user.email });

    res.setHeader(
      "Set-Cookie",
      cookie.serialize("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 zile
      })
    );

    return res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (e: any) {
    return res.status(500).json({ error: "Eroare server" });
  }
}
