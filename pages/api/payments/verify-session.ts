import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { prisma } from "../../../lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-11-20.acacia",
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID required" });
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ 
        success: false, 
        error: "Payment not completed" 
      });
    }

    // Find purchase in database
    const purchase = await prisma.purchase.findUnique({
      where: { stripeSessionId: sessionId },
      select: {
        id: true,
        credits: true,
        amount: true,
        currency: true,
        status: true,
      },
    });

    if (!purchase) {
      return res.status(404).json({ 
        success: false, 
        error: "Purchase not found" 
      });
    }

    return res.status(200).json({
      success: true,
      purchase: {
        credits: purchase.credits,
        amount: purchase.amount,
        currency: purchase.currency,
        status: purchase.status,
      },
    });

  } catch (error) {
    console.error("Verify session error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return res.status(500).json({ success: false, error: message });
  }
}