// pages/api/auth/me.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "../../../lib/auth";
import { promises as fs } from "fs";
import path from "path";

const USERS_FILE = path.resolve(process.cwd(), "data/users.json");

async function readUsers() {
  try {
    const raw = await fs.readFile(USERS_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies?.token;
  if (!token) return res.status(200).json({ user: null });

  const payload = verifyToken(token);
  if (!payload) return res.status(200).json({ user: null });

  const users = await readUsers();
  const user = users.find((u: any) => u.id === payload.id);
  if (!user) return res.status(200).json({ user: null });

  const safe = { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt };
  res.status(200).json({ user: safe });
}
