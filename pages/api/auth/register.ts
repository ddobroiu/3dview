// pages/api/auth/register.ts
import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
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

async function writeUsers(users: User[]) {
  await fs.mkdir(path.dirname(USERS_FILE), { recursive: true });
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { username, email, password } = req.body ?? {};

  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  const users = await readUsers();

  if (users.find((u) => u.username === username || (email && u.email === email))) {
    return res.status(409).json({ error: "User already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser: User = {
    id: uuidv4(),
    username,
    email: email || undefined,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  await writeUsers(users);

  // semnează token
  const token = signToken({ id: newUser.id, username: newUser.username, email: newUser.email });

  // setează cookie HttpOnly
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

  const safe = { id: newUser.id, username: newUser.username, email: newUser.email, createdAt: newUser.createdAt };
  return res.status(201).json({ user: safe });
}
