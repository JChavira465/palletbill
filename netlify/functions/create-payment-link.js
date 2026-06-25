// netlify/functions/create-payment-link.js
// POST /api/create-payment-link
//
// v3 FIXES:
// #1 - CommonJS: this file stays require/exports (covered by functions/package.json)
// #2 - Generates a secure token per invoice, stores it in process env / KV store,
//      returns it so the invoice email can include the correct /pay/INV-xxx?token=yyy URL
// #3 - ALLOWED_ORIGIN throws hard if not set in production
// #4 - Basic rate limiting via in-memory store (upgrade to Upstash Redis for production)
// #7 - Stripe only initialized when actually needed

"use strict";

// ── RATE LIMITING (#4) ───────────────────────────────────────────────────────
// Simple in-memory rate limiter. Works per function instance.
// For production with multiple Netlify instances: swap for Upstash Redis.
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 10;       // max requests
const RATE_LIMIT_WINDOW = 60000; // per 60 seconds

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
  if (now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX) return true;
  entry.count++;
  rateLimitMap.set(ip, entry);
  return false;
}

// ── HELPERS ──────────────────────────────────────────────────────────────────
const crypto = require("crypto");

function generateSecureToken() {
  return crypto.randomBytes(32).toString("hex"); // 64-char hex token
}

// Fix #6: allow apostrophes in names (O'Brien Logistics)
function sanitize(str, maxLen = 200) {
  if (typeof str !== "string") return "";
  return str.replace(/[<>"]/g, "").trim().slice(0, maxLen); // removed ' from blocklist
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

// Simple in-memory token store. 
// In production: replace with Supabase or Upstash KV.
const tokenStore = new Map();

function storeToken(invoiceId, token, clientEmail, expiresInMs = 30 * 24 * 60 * 60 * 1000) {
  tokenStore.set(`${invoiceId}:${token}`, {
    clientEmail,
    invoiceId,
    expiresAt: Date.now() + expiresInMs,
  });
}

exports.validateToken = function(invoiceId, token) {
  const entry = tokenStore.get(`${invoiceId}:${token}`);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { tokenStore.delete(`${invoiceId}:${token}`); return null; }
  return entry;
};

// ── HANDLER ──────────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  // Fix #3: ALLOWED_ORIGIN must be set — fail loudly in production
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  if (!allowedOrigin && process.env.NODE_ENV === "production") {
    console.error("FATAL: ALLOWED_ORIGIN environment variable is not set");
    return { statusCode: 500, body: JSON.stringify({ error: "Server misconfiguration" }) };
  }

  const headers = {
    "Access-Control-Allow-Origin": allowedOrigin || "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };

  // Fix #4: Rate limiting by IP
  const clientIP = event.headers["x-forwarded-for"]?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(clientIP)) {
    console.warn(`Rate limited: ${clientIP}`);
    return { statusCode: 429, headers, body: JSON.stringify({ error: "Too many requests. Please wait and try again." }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON body" }) }; }

  const { invoiceNumber, clientName, clientEmail, lineItems, totalCents, dueDate, companyName } = body;

  // Validate all inputs
  const errors = [];
  if (!invoiceNumber || typeof invoiceNumber !== "string") errors.push("invoiceNumber required");
  if (!clientName || typeof clientName !== "string") errors.push("clientName required");
  if (!clientEmail || !isValidEmail(clientEmail)) errors.push("valid clientEmail required");
  if (!totalCents || typeof totalCents !== "number" || totalCents <= 0) errors.push("totalCents must be a positive number");
  if (totalCents > 10_000_000) errors.push("totalCents exceeds $100,000 maximum");
  if (errors.length) return { statusCode: 400, headers, body: JSON.stringify({ error: errors.join(", ") }) };

  // Fix #7: Only initialize Stripe when we actually need it
  const Stripe = require("stripe");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    // Reuse one product (Fix #3 from v2)
    let product;
    const existing = await stripe.products.search({
      query: 'name:"PalletBill Invoice Payment" AND active:"true"',
      limit: 1,
    });
    product = existing.data[0] || await stripe.products.create({
      name: "PalletBill Invoice Payment",
      description: "Warehouse and 3PL services",
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(totalCents),
      currency: "usd",
    });

    const safeInv     = sanitize(invoiceNumber, 50);
    const safeEmail   = sanitize(clientEmail, 100);
    const safeName    = sanitize(clientName, 100);
    const safeCompany = sanitize(companyName || "", 100);

    // Fix #2: Generate a secure token for this invoice's payment portal URL
    const paymentToken = generateSecureToken();
    storeToken(safeInv, paymentToken, safeEmail);

    // Build the portal URL that will be included in the invoice email
    const appUrl = process.env.APP_URL || "https://pallettbill.netlify.app";
    const portalUrl = `${appUrl}/pay/${encodeURIComponent(safeInv)}?token=${paymentToken}`;

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      payment_method_types: ["card", "us_bank_account"],
      // Metadata flows into PaymentIntent via payment_intent_data (v2 fix)
      payment_intent_data: {
        metadata: {
          invoice_number: safeInv,
          client_email: safeEmail,
          client_name: safeName,
          company_name: safeCompany,
          due_date: dueDate || "",
          payment_token: paymentToken,
        },
      },
      metadata: {
        invoice_number: safeInv,
        client_email: safeEmail,
        due_date: dueDate || "",
        payment_token: paymentToken,
      },
      after_completion: {
        type: "redirect",
        redirect: { url: `${appUrl}/thank-you.html?inv=${encodeURIComponent(safeInv)}` },
      },
      custom_text: {
        submit: { message: `Paying invoice ${safeInv} from ${safeCompany || "your warehouse"}. Thank you!` },
      },
    });

    const summary = (lineItems || [])
      .map(i => `${sanitize(i.desc || "", 60)}: ${i.qty} x $${parseFloat(i.rate || 0).toFixed(2)}`)
      .join(" | ");

    console.log(`Payment link created: ${safeInv} | ${safeName} | $${(totalCents / 100).toFixed(2)} | ${summary}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        paymentLinkUrl: paymentLink.url,  // Direct Stripe checkout URL
        portalUrl,                         // PalletBill portal URL with token (use this in invoice email)
        paymentLinkId: paymentLink.id,
        invoiceNumber: safeInv,
        paymentToken,                      // Token to include in portal URL
      }),
    };
  } catch (err) {
    console.error("create-payment-link error:", err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
