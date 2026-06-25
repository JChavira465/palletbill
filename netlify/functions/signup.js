// netlify/functions/signup.js
// POST /api/signup
//
// v3 FIXES:
// #1 - CommonJS (covered by functions/package.json "type":"commonjs")
// #3 - ALLOWED_ORIGIN hard fails if missing in production
// #4 - Rate limiting by IP
// #6 - Apostrophes allowed in company names (O'Brien Logistics)

"use strict";

// Fix #4: Rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 60000;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
  if (now > entry.resetAt) { rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW }); return false; }
  if (entry.count >= RATE_LIMIT_MAX) return true;
  entry.count++;
  rateLimitMap.set(ip, entry);
  return false;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

// Fix #6: Allow apostrophes — only strip actual dangerous chars
function sanitize(str, maxLen = 200) {
  if (typeof str !== "string") return "";
  return str.replace(/[<>"]/g, "").trim().slice(0, maxLen);
}

exports.handler = async (event) => {
  // Fix #3: Hard fail if ALLOWED_ORIGIN not set in production
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  if (!allowedOrigin && process.env.NODE_ENV === "production") {
    console.error("FATAL: ALLOWED_ORIGIN not set");
    return { statusCode: 500, body: JSON.stringify({ error: "Server misconfiguration" }) };
  }

  const headers = {
    "Access-Control-Allow-Origin": allowedOrigin || "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };

  // Fix #4: Rate limit by IP
  const clientIP = event.headers["x-forwarded-for"]?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(clientIP)) {
    return { statusCode: 429, headers, body: JSON.stringify({ error: "Too many requests. Please wait a minute and try again." }) };
  }

  let email, company, source;
  try {
    // Fix #1 from v2: case-insensitive Content-Type check
    const ct = (event.headers["content-type"] || event.headers["Content-Type"] || "").toLowerCase();
    if (ct.includes("application/json")) {
      const parsed = JSON.parse(event.body);
      email = parsed.email; company = parsed.company; source = parsed.source;
    } else {
      const params = new URLSearchParams(event.body);
      email = params.get("email"); company = params.get("company"); source = params.get("source") || "landing-page";
    }
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Could not parse request body" }) };
  }

  if (!email || !isValidEmail(email)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Valid email address is required" }) };
  }

  const safeEmail   = sanitize(email, 100);
  const safeCompany = sanitize(company || "", 100);
  const safeSource  = sanitize(source || "landing-page", 50);

  try {
    const contactRes = await fetch("https://app.loops.so/api/v1/contacts/create", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.LOOPS_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: safeEmail, company: safeCompany, source: safeSource,
        userGroup: "waitlist",
        mailingLists: { [process.env.LOOPS_WAITLIST_ID]: true },
      }),
    });

    if (!contactRes.ok) {
      const err = await contactRes.json().catch(() => ({}));
      if (!err.message?.toLowerCase().includes("already")) {
        console.error(`Loops contact failed for ${safeEmail}:`, err);
      }
    }

    const emailRes = await fetch("https://app.loops.so/api/v1/transactional", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.LOOPS_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        transactionalId: process.env.LOOPS_WELCOME_EMAIL_ID,
        email: safeEmail,
        dataVariables: { company: safeCompany || "your warehouse" },
      }),
    });

    if (!emailRes.ok) {
      const body = await emailRes.text();
      console.error(`Loops welcome email failed for ${safeEmail}: ${emailRes.status} ${body}`);
    } else {
      console.log(`Signup + welcome email: ${safeEmail} | ${safeCompany} | ${safeSource}`);
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("signup error:", err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Signup failed — please try again" }) };
  }
};
