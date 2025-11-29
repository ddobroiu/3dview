// lib/auth.ts
import jwt, { SignOptions } from "jsonwebtoken";

const JWT_SECRET: string = process.env.JWT_SECRET || "dev_secret_change_me";

export type JWTPayload = {
  id: string;
  username: string;
  email: string;
};

export function signToken(payload: JWTPayload, expiresIn: string = "7d"): string {
  const options: SignOptions = { expiresIn };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as JWTPayload;
  } catch {
    return null;
  }
}
