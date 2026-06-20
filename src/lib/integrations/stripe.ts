/**
 * Stripe — "Unlock Prime mode — €1" willingness-to-pay demo.
 * If STRIPE_SECRET_KEY is missing we return a simulated success URL so the
 * traction flow still works in demos.
 */
import Stripe from "stripe";

const KEY = () => process.env.STRIPE_SECRET_KEY?.trim();

export function stripeConfigured(): boolean {
  return Boolean(KEY());
}

export type CheckoutResult = {
  url: string;
  simulated: boolean;
};

export async function createPrimeCheckout(
  origin: string,
): Promise<CheckoutResult> {
  const key = KEY();
  if (!key) {
    return { url: `${origin}/?prime=success&simulated=1`, simulated: true };
  }
  const stripe = new Stripe(key);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: 100, // €1.00
          product_data: {
            name: "Sounday — Unlock Prime mode",
            description: "Confidence-priming hype tracks for your high-stakes meetings.",
          },
        },
      },
    ],
    success_url: `${origin}/?prime=success`,
    cancel_url: `${origin}/?prime=cancelled`,
  });
  return { url: session.url ?? `${origin}/?prime=success`, simulated: false };
}
