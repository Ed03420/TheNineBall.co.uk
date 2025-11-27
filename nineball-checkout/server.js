// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const Stripe = require('stripe');

const app = express();

// In production, set your exact domain:
// app.use(cors({ origin: "https://yourdomain.com" }));
app.use(cors({ origin: true }));
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

if (!process.env.STRIPE_SECRET_KEY) {
  console.error("ERROR: Missing STRIPE_SECRET_KEY in .env file.");
  process.exit(1);
}

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// =======================
// CREATE CHECKOUT SESSION
// =======================
app.post('/api/create-checkout', async (req, res) => {
  try {
    const { total, customerEmail, metadata } = req.body;

    if (!customerEmail) {
      return res.status(400).json({ error: "Missing customerEmail" });
    }
    if (typeof total !== "number" && typeof total !== "string") {
      return res.status(400).json({ error: "Invalid or missing total" });
    }

    const amount = Math.round(Number(total) * 100);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Total must be greater than 0" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customerEmail,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: "Nine Ball Order"
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: metadata || {},
      success_url: process.env.SUCCESS_URL,
      cancel_url: process.env.CANCEL_URL
    });

    res.json({ url: session.url });

  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    res.status(500).json({ error: "Failed to create Stripe session" });
  }
});

app.listen(PORT, () =>
  console.log(`Server running → http://localhost:${PORT}`)
);
