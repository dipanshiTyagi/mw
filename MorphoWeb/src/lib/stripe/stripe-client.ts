// import { loadStripe, Stripe } from "@stripe/stripe-js";

// let stripePromise: Promise<Stripe | null>;
// export const getStripe = (connectedAccountId?: string) => {
//   if (!stripePromise) {
//     stripePromise = loadStripe(
//       process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
//       { stripeAccount: connectedAccountId }
//     );
//   }
//   return stripePromise;
// };


/* lib/stripe/stripe-client.ts
 * Returns Stripe.js for the browser OR a stub when MOCK_STRIPE is on.
 */
import { Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null>;

export const getStripe = async (connectedAccountId?: string) => {
  /* ─── fully mocked front-end in demo mode ─── */
  if (process.env.NEXT_PUBLIC_MOCK_STRIPE === "true") {
    return {
      redirectToCheckout: async () => ({ error: undefined }),
      initEmbeddedCheckout: async () => {},
    } as unknown as Stripe;
  }

  /* ─── real Stripe.js loader ─── */
  if (!stripePromise) {
    const { loadStripe } = await import("@stripe/stripe-js");
    stripePromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
      { stripeAccount: connectedAccountId }
    );
  }
  return stripePromise;
};
