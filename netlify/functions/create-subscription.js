// netlify/functions/create-subscription.js
// POST /api/create-subscription
// Creates a Stripe Checkout session for a subscription plan

"use strict";

const PLAN_PRICES = {
  starter: { amount: 4900, name: "PalletBill Starter" },
  growth:  { amount: 9900, name: "PalletBill Growth" },
  pro:     { amount: 19900, name: "PalletBill Pro" },
};

exports.handler = async (event) => {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";
  const headers = {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  const { plan, userId, email } = body;

  if (!plan || !PLAN_PRICES[plan]) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid plan. Must be starter, growth, or pro." }) };
  }
  if (!userId || !email) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "userId and email required" }) };
  }

  const Stripe = require("stripe");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const appUrl = process.env.APP_URL || "https://pallettbill.netlify.app";

  try {
    // Find or create a Stripe product for this plan
    const planData = PLAN_PRICES[plan];
    let product;
    const existing = await stripe.products.search({
      query: `name:"${planData.name}" AND active:"true"`,
      limit: 1,
    });
    product = existing.data[0] || await stripe.products.create({
      name: planData.name,
      description: `PalletBill ${plan.charAt(0).toUpperCase() + plan.slice(1)} monthly subscription`,
    });

    // Find or create a recurring price
    const prices = await stripe.prices.list({ product: product.id, active: true, type: "recurring", limit: 10 });
    let price = prices.data.find(p => p.unit_amount === planData.amount && p.recurring?.interval === "month");
    if (!price) {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: planData.amount,
        currency: "usd",
        recurring: { interval: "month" },
      });
    }

    // Create Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: { user_id: userId, plan },
      subscription_data: {
        metadata: { user_id: userId, plan },
      },
      success_url: `${appUrl}/app?subscription=success&plan=${plan}`,
      cancel_url: `${appUrl}/app?subscription=cancelled`,
    });

    console.log(`Subscription checkout created: ${plan} for ${email}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ checkoutUrl: session.url, sessionId: session.id }),
    };
  } catch (err) {
    console.error("create-subscription error:", err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
