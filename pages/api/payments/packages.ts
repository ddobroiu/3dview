import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const packages = await prisma.creditPackage.findMany({
      where: { active: true },
      orderBy: { credits: 'asc' },
      select: {
        id: true,
        name: true,
        credits: true,
        price: true,
        currency: true,
        popular: true,
        bonus: true,
      },
    });

    return res.status(200).json({ packages });
  } catch (error) {
    console.error("Get packages error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return res.status(500).json({ error: message });
  }
}