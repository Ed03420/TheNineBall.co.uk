// /api/create-checkout.js
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { total, customerEmail, metadata } = req.body;

    if (!customerEmail) return res.status(400).json({ error: "Missing customerEmail" });
    if (typeof total === "undefined" || isNaN(Number(total))) {
      return res.status(400).json({ error: "Invalid total" });
    }

    const amount = Math.round(Number(total) * 100); // GBP -> pence
    if (amount <= 0) return res.status(400).json({ error: "Total must be > 0" });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: "The Nine Ball Order",
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: metadata || {},
      success_url: process.env.SUCCESS_URL || "https://the-nine-ball-co-uk.vercel.app/success.html",
      cancel_url: process.env.CANCEL_URL || "https://the-nine-ball-co-uk.vercel.app/cancel.html",
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("create-checkout error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
