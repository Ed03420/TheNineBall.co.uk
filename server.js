const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const Stripe = require('stripe');

const app = express();
app.use(cors({ origin: true }));
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

if (!process.env.STRIPE_SECRET_KEY) {
  console.error("ERROR: Missing STRIPE_SECRET_KEY");
  process.exit(1);
}

app.post('/api/create-checkout', async (req, res) => {
  try {
    const { total, customerEmail, metadata } = req.body;

    // Validate fields
    if (!customerEmail)
      return res.status(400).json({ error: "Missing customerEmail" });

    if (isNaN(total))
      return res.status(400).json({ error: "Invalid total" });

    // Convert to GBP minor units
    const amount = Math.round(Number(total) * 100);

    if (amount <= 0)
      return res.status(400).json({ error: "Total must be greater than 0" });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customerEmail,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: { name: "Nine Ball Order" },
            unit_amount: amount,
          },
          quantity: 1,
        }
      ],
      metadata: metadata || {},
      success_url: process.env.SUCCESS_URL,
      cancel_url: process.env.CANCEL_URL,
    });

    return res.json({ url: session.url });

  } catch (err) {
    console.error("Stripe Checkout Error:", err);
    res.status(500).json({ error: "Failed to create Stripe session" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
