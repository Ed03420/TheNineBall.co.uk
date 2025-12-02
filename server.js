// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const Stripe = require('stripe');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true }));
app.use(bodyParser.json());

if (!process.env.STRIPE_SECRET_KEY) {
  console.error("ERROR: Missing STRIPE_SECRET_KEY");
  process.exit(1);
}


app.post('/api/create-checkout', async (req, res) => {
  try {
    const { total, customerEmail, metadata } = req.body;

    if (!customerEmail) {
      return res.status(400).json({ error: "Missing customerEmail" });
    }

    const amount = Math.round(Number(total) * 100); // GBP → pence
    if (amount <= 0) return res.status(400).json({ error: "Invalid total" });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: { name: "The Nine Ball Order" },
            unit_amount: amount
          },
          quantity: 1,
        }
      ],
      metadata: metadata || {},
      success_url: process.env.SUCCESS_URL,
      cancel_url: process.env.CANCEL_URL
    });

    
    return res.json({ url: session.url });

  } catch (err) {
    console.error('Stripe Checkout Error:', err);
    return res.status(500).json({ error: "Failed to create Stripe session" });
  }


});



app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// /api/config.js
export default function handler(req, res) {
  const publishable = process.env.STRIPE_PUBLIC_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!publishable) {
    return res.status(500).json({ error: "pk_live_51STjqxRwaDEwT9Ba2sRi10Y9nuE7OezyPrqwchVY76x8E3uZ3CkscP1idIYje3bb2NlvttV9WFZRU4ssKQVerx2Q00NwpGB4ZC" });
  }
  res.status(200).json({ publishableKey: publishable });
}


// /api/webhook.js
import Stripe from "stripe";
import { buffer } from "micro";

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn("No STRIPE_WEBHOOK_SECRET configured.");
    // still try to parse without verification - for quick dev (not recommended in prod)
  }

  let event;
  try {
    const body = await buffer(req);
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      // Fall back (unsafe) - parse body as JSON if no secret (use only for local testing)
      event = JSON.parse(body.toString());
    }
  } catch (err) {
    console.error("Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  // Handle the event types you care about:
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    // TODO: Fulfill the order: save to DB, send email, etc.
    console.log("Checkout session completed:", session.id, session.customer_email);
  }

  res.status(200).send("OK");
}
