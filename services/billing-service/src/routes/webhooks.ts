import { Router, Request, Response } from 'express';
import express from 'express';
import Stripe from 'stripe';
import { handlePaymentSucceeded, handleInvoicePaid, handleSubscriptionUpdated } from '../services/subscriptions';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// POST /webhooks/stripe — Stripe webhook handler
// Uses raw body for signature verification (NOT json parsed)
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error('[webhooks/stripe] Signature verification failed:', (err as Error).message);
      return res.status(400).json({ error: 'Webhook signature verification failed' });
    }

    try {
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await handlePaymentSucceeded(paymentIntent);
          break;
        }
        case 'invoice.paid': {
          const invoice = event.data.object as Stripe.Invoice;
          await handleInvoicePaid(invoice);
          break;
        }
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionUpdated(subscription);
          break;
        }
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionUpdated(subscription);
          break;
        }
        default:
          console.log(`[webhooks/stripe] Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (err) {
      console.error(`[webhooks/stripe] Error handling ${event.type}:`, (err as Error).message);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  }
);

export default router;
