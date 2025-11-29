import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { prisma } from "../../../lib/db";
import { addCredits } from "../../../lib/credits";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-11-20.acacia",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    const body = req.body;
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.payment_status === 'paid') {
          const purchaseId = session.client_reference_id;
          const userId = session.metadata?.userId;
          const creditsStr = session.metadata?.credits;

          if (!purchaseId || !userId || !creditsStr) {
            console.error('Missing metadata in webhook:', { purchaseId, userId, creditsStr });
            break;
          }

          const credits = parseInt(creditsStr, 10);

          // Update purchase status
          const purchase = await prisma.purchase.update({
            where: { id: purchaseId },
            data: { 
              status: "COMPLETED",
              completedAt: new Date(),
            },
          });

          // Add credits to user
          await addCredits(
            userId,
            credits,
            'PURCHASE',
            `Credit purchase - ${purchase.credits} credits`,
            purchaseId
          );

          console.log(`Successfully processed purchase ${purchaseId} for user ${userId}: ${credits} credits`);
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const purchaseId = session.client_reference_id;

        if (purchaseId) {
          await prisma.purchase.update({
            where: { id: purchaseId },
            data: { status: "FAILED" },
          });
          console.log(`Purchase ${purchaseId} expired`);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const purchaseId = paymentIntent.metadata?.purchaseId;

        if (purchaseId) {
          await prisma.purchase.update({
            where: { id: purchaseId },
            data: { status: "FAILED" },
          });
          console.log(`Payment failed for purchase ${purchaseId}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}