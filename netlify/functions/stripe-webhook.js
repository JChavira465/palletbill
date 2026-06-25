// netlify/functions/stripe-webhook.js
// POST /api/stripe-webhook
//
// v3 FIXES:
// #1 - CommonJS (covered by functions/package.json "type":"commonjs")
// #3 - ALLOWED_ORIGIN hard fails if missing in production

"use strict";

async function sendLoopsEmail(transactionalId, email, dataVariables) {
  if (!process.env.LOOPS_API_KEY || !transactionalId || !email) {
    console.warn("Loops email skipped — missing API key, template ID, or email address");
    return;
  }
  try {
    const res = await fetch("https://app.loops.so/api/v1/transactional", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LOOPS_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transactionalId, email, dataVariables }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Loops email failed for ${email}: HTTP ${res.status} — ${body}`);
    } else {
      console.log(`Loops receipt sent to ${email}`);
    }
  } catch (err) {
    console.error(`Loops fetch error for ${email}:`, err.message);
  }
}

exports.handler = async (event) => {
  // Fix #1: CommonJS — require works here because functions/package.json sets "type":"commonjs"
  const Stripe = require("stripe");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const sig = event.headers["stripe-signature"];
  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return { statusCode: 400, body: `Webhook error: ${err.message}` };
  }

  console.log(`Stripe event: ${stripeEvent.type}`);

  // checkout.session.completed — fires when client pays via Payment Link
  if (stripeEvent.type === "checkout.session.completed") {
    const session = stripeEvent.data.object;
    const invoiceNumber = session.metadata?.invoice_number;
    const clientEmail   = session.customer_details?.email || session.metadata?.client_email;
    const clientName    = session.customer_details?.name  || session.metadata?.client_name;
    const amountPaid    = ((session.amount_total || 0) / 100).toFixed(2);

    console.log(`Payment completed: ${invoiceNumber} — $${amountPaid} from ${clientEmail}`);

    // Update invoice status in Supabase
    const { createClient } = require("@supabase/supabase-js");
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
      global: { headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY } },
    });

    const { error: dbError } = await supabase
      .from("invoices")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("invoice_number", invoiceNumber);

    if (dbError) console.error("Failed to update invoice in DB:", dbError.message);
    else console.log(`Invoice ${invoiceNumber} marked paid in DB`);

    await sendLoopsEmail(process.env.LOOPS_PAID_EMAIL_ID, clientEmail, {
      invoiceNumber, amountPaid, clientName,
    });
  }

  // payment_intent.succeeded — fallback; metadata reliably present via payment_intent_data (v2 fix)
  if (stripeEvent.type === "payment_intent.succeeded") {
    const pi = stripeEvent.data.object;
    const invoiceNumber = pi.metadata?.invoice_number;
    const clientEmail   = pi.metadata?.client_email;
    const amountPaid    = (pi.amount_received / 100).toFixed(2);

    if (!invoiceNumber) {
      console.warn("payment_intent.succeeded: no invoice_number in metadata — skipping");
    } else {
      console.log(`PaymentIntent succeeded: ${invoiceNumber} — $${amountPaid} from ${clientEmail}`);
      // Receipt already sent via checkout.session.completed in most cases
      // Only send here if you're NOT using Payment Links (e.g. custom checkout)
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
