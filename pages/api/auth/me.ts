// pages/api/auth/me.ts
import type { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";
import { verifyToken } from "../../../lib/auth";
import { prisma } from "../../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies.token;
  if (!token) return res.status(401).json({ user: null });

  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ user: null });

  const dbUser = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, username: true, email: true, createdAt: true },
  });

  return res.status(200).json({ user: dbUser });
}
