const express = require("express");
const app = express();
const stripe = require("stripe")("sk_test_YOUR_SECRET_KEY");

app.post("/create-checkout-session", async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "gbp",
        product_data: { name: "Tattoo Aftercare Kit" },
        unit_amount: 1500,
      },
      quantity: 1,
    }],
    mode: "payment",
    success_url: "https://www.thenineball.co.uk/success",
    cancel_url: "https://www.thenineball.co.uk/cancel",
  });
  res.json({ id: session.id });
});
