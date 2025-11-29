import type { NextApiRequest, NextApiResponse } from "next";
import { getUserCredits, getCreditHistory } from "../../../lib/credits";
import jwt from "jsonwebtoken";
import cookie from "cookie";

async function getUserFromToken(req: NextApiRequest): Promise<{ id: string } | null> {
  try {
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.token;
    
    if (!token) return null;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
    return { id: decoded.userId };
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Authenticate user
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Get user credits
    const credits = await getUserCredits(user.id);
    if (!credits) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get credit history
    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    const history = await getCreditHistory(user.id, limitNum, offset);

    return res.status(200).json({
      credits: credits.credits,
      totalUsed: credits.totalUsed,
      subscriptionTier: credits.subscriptionTier,
      history: history.transactions,
      totalTransactions: history.total,
      currentPage: pageNum,
      totalPages: Math.ceil(history.total / limitNum),
    });

  } catch (error) {
    console.error("Credits API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return res.status(500).json({ error: message });
  }
}