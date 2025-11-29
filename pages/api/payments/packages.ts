import type { NextApiRequest, NextApiResponse } from "next";
import { CREDIT_PACKAGES } from "../../../lib/credit-packages";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Return standardized credit packages
    const packages = CREDIT_PACKAGES.map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      credits: pkg.credits,
      price: pkg.price,
      currency: 'USD',
      popular: pkg.popular || false,
      bonus: pkg.bonus || 0,
      features: pkg.features,
      stripePriceId: pkg.stripePriceId
    }));

    return res.status(200).json({ packages });
  } catch (error) {
    console.error("Get packages error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return res.status(500).json({ error: message });
  }
}