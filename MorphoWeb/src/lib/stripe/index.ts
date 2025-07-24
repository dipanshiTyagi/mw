// import Stripe from "stripe";
// export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
//   apiVersion: "2024-04-10",
//   appInfo: {
//     name: "MacroEncode Plura",
//     version: "0.1.0",
//   },
// });



import Stripe from "stripe";

const isMock = process.env.MOCK_STRIPE === "true";

/* ───────── helpers ───────── */
const rand = (pfx: string) => `${pfx}_${Math.random().toString(36).slice(2, 10)}`;

/* ───────── lightweight fake implementation ───────── */
const fakeStripe = {
  /* Products & Prices */
  products: {
    list: async () => ({ data: [] }),
  },
  prices: {
    list: async () => ({ data: [] }),
  },

  /* Checkout */
  checkout: {
    sessions: {
      create: async () => ({
        id: rand("cs_mock"),
        client_secret: rand("cs_secret"),
        url: "/mock-checkout-success",
      }),
    },
  },

  /* Subscriptions */
  subscriptions: {
    create: async () => ({
      id: rand("sub_mock"),
      latest_invoice: { payment_intent: { client_secret: rand("pi_secret") } },
    }),
    retrieve: async () => ({
      items: { data: [{ id: rand("si_mock") }] },
      latest_invoice: { payment_intent: { client_secret: rand("pi_secret") } },
    }),
    update: async () => ({
      id: rand("sub_mock"),
      latest_invoice: { payment_intent: { client_secret: rand("pi_secret") } },
    }),
  },

  /* Charges */
  charges: {
    list: async () => ({ data: [] }),
  },

  /* Customers */
  customers: {
    create: async () => ({ id: rand("cus_mock") }),
  },

  /* Webhooks (only needed so the `constructEvent` call exists) */
  webhooks: {
    constructEvent: () => ({} as Stripe.Event),
  },
} as unknown as Stripe;

/* ───────── export the right client ───────── */
export const stripe: Stripe = isMock
  ? fakeStripe
  : new Stripe(process.env.STRIPE_SECRET_KEY || "", {
      apiVersion: "2024-04-10",
      appInfo: { name: "MacroEncode Plura", version: "0.1.0" },
    });
