// lib/auth-helpers.ts
import type { NextApiRequest } from "next";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { JWTPayload } from "./auth";

export async function getUserFromRequest(req: NextApiRequest): Promise<JWTPayload | null> {
  try {
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.token;
    
    if (!token) return null;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_me') as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export function requireAuth(user: JWTPayload | null) {
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}