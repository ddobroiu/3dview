import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { prisma } from "../../../lib/db";
import jwt from "jsonwebtoken";
import cookie from "cookie";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-11-20.acacia",
});

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
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Authenticate user
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { packageId } = req.body;

    // Get credit package
    const creditPackage = await prisma.creditPackage.findUnique({
      where: { id: packageId },
    });

    if (!creditPackage || !creditPackage.active) {
      return res.status(404).json({ error: "Package not found or inactive" });
    }

    // Create purchase record
    const purchase = await prisma.purchase.create({
      data: {
        userId: user.id,
        amount: creditPackage.price,
        credits: creditPackage.credits + creditPackage.bonus,
        currency: creditPackage.currency,
        status: "PENDING",
      },
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: creditPackage.currency.toLowerCase(),
            product_data: {
              name: creditPackage.name,
              description: `${creditPackage.credits} credite + ${creditPackage.bonus} bonus`,
            },
            unit_amount: Math.round(creditPackage.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?tab=credits`,
      client_reference_id: purchase.id,
      metadata: {
        purchaseId: purchase.id,
        userId: user.id,
        credits: (creditPackage.credits + creditPackage.bonus).toString(),
      },
    });

    // Update purchase with session ID
    await prisma.purchase.update({
      where: { id: purchase.id },
      data: { stripeSessionId: session.id },
    });

    return res.status(200).json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error("Create checkout session error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return res.status(500).json({ error: message });
  }
}