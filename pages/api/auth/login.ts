// pages/api/auth/login.ts
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { promises as fs } from "fs";
import path from "path";
import { signToken } from "../../../lib/auth";
import cookie from "cookie";

type User = {
  id: string;
  username: string;
  email?: string;
  passwordHash: string;
  createdAt: string;
};

const USERS_FILE = path.resolve(process.cwd(), "data/users.json");

async function readUsers(): Promise<User[]> {
  try {
    const raw = await fs.readFile(USERS_FILE, "utf8");
    return JSON.parse(raw) as User[];
  } catch (err) {
    return [];
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { username, password } = req.body ?? {};
  if (!username || !password) return res.status(400).json({ error: "username and password are required" });

  const users = await readUsers();
  const user = users.find((u) => u.username === username || u.email === username);

  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signToken({ id: user.id, username: user.username, email: user.email });

  res.setHeader(
    "Set-Cookie",
    cookie.serialize("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })
  );

  const safe = { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt };
  return res.status(200).json({ user: safe });
}