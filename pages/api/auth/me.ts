// pages/api/auth/me.ts
import type { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";
import { verifyToken } from "../../../lib/auth";
import { prisma } from "../../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies.token;
    
    if (!token) {
      return res.status(401).json({ user: null, error: "No token found" });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ user: null, error: "Invalid token" });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, username: true, email: true, createdAt: true, credits: true },
    });

    if (!dbUser) {
      return res.status(401).json({ user: null, error: "User not found" });
    }

    return res.status(200).json({ user: dbUser });
  } catch (error: any) {
    console.error("Auth me error:", error);
    return res.status(500).json({ user: null, error: "Server error" });
  }
}
