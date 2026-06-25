import { useState, useCallback, useMemo, useEffect } from "react";
import { supabase } from "./supabaseClient";

// ─── PALETTE & TOKENS ────────────────────────────────────────────────────────
const C = {
  green: "#1D9E75", greenL: "#E1F5EE", greenD: "#0F6E56", greenM: "#17835F",
  text: "#1a1a18", text2: "#5a5a56", text3: "#9a9a94",
  bg: "#f4f4f1", card: "#ffffff", bg2: "#eceae6",
  border: "rgba(0,0,0,0.09)", border2: "rgba(0,0,0,0.15)",
  red: "#B91C1C", redL: "#FEF2F2", redB: "#FECACA",
  blue: "#1D4ED8", blueL: "#EEF2FF",
  amber: "#92400E", amberL: "#FEF3C7",
  purple: "#5B21B6", purpleL: "#EDE9FE",
  stripe: "#635BFF",
};

// ─── SEED DATA ────────────────────────────────────────────────────────────────
const SEED_CONTACTS = [
  { id: 1, name: "Jeff Kogut", title: "Director of Operations", company: "Crossroads 3PL Solutions", email: "jeffkogut@crossroads3pl.com", phone: "(254) 773-0018", city: "Temple, TX", stage: "Trial", tags: ["Temple", "Rail & Truck"], value: 1188, notes: "Fellow Temple local. Very interested. Offered in-person walkthrough.", lastContact: "2026-06-23", nextFollowUp: "2026-06-30", source: "Cold email", invoices: ["INV-1001"], activities: [{ id: 1, type: "email", text: "Sent intro email with 60-day free trial offer", date: "2026-06-23", user: "Jose" }, { id: 2, type: "note", text: "Also sent to info@crossroads3pl.com — primary inbox", date: "2026-06-23", user: "Jose" }] },
  { id: 2, name: "Salman", title: "Owner", company: "One Click 3PL", email: "oneclick3pl@gmail.com", phone: "(737) 707-9975", city: "Temple, TX", stage: "Contacted", tags: ["Temple", "eCommerce", "FBA"], value: 588, notes: "5.0 stars on Google. 54 reviews. Shopify, Amazon, TikTok focused. Very active operator.", lastContact: "2026-06-23", nextFollowUp: "2026-06-28", source: "Google Maps", invoices: [], activities: [{ id: 1, type: "email", text: "Sent intro email — neighbor pitch", date: "2026-06-23", user: "Jose" }] },
  { id: 3, name: "Amanda Sheppard", title: "Managing Member", company: "Brown Box Ninja", email: "info@brownboxninja.com", phone: "(254) 271-4788", city: "Temple, TX", stage: "Contacted", tags: ["Temple", "FBA Prep", "Amazon"], value: 588, notes: "11 years in business. A+ BBB. 50,000 sq ft. Very established.", lastContact: "2026-06-23", nextFollowUp: "2026-06-28", source: "Google Maps", invoices: [], activities: [{ id: 1, type: "email", text: "Sent intro email", date: "2026-06-23", user: "Jose" }] },
  { id: 4, name: "Barrett Shepherd", title: "Owner", company: "Simpl Fulfillment", email: "hello@simplfulfillment.com", phone: "(512) 631-8522", city: "Austin, TX", stage: "Trial", tags: ["Austin", "DTC", "eCommerce"], value: 1188, notes: "Email already delivered. Great fit for subscription billing automation.", lastContact: "2026-06-23", nextFollowUp: "2026-07-01", source: "Cold email", invoices: ["INV-1002"], activities: [{ id: 1, type: "email", text: "Email delivered successfully to hello@simplfulfillment.com", date: "2026-06-23", user: "Jose" }] },
  { id: 5, name: "Jay", title: "Owner", company: "Nationwide Prestige Warehousing", email: "info@nationwideprestige3pl.com", phone: "(469) 577-4123", city: "Grand Prairie, TX", stage: "Contacted", tags: ["Dallas", "Full Service"], value: 1188, notes: "5.0 stars. Personalized service focus. Great culture fit.", lastContact: "2026-06-23", nextFollowUp: "2026-06-30", source: "Google Maps", invoices: [], activities: [{ id: 1, type: "email", text: "Sent intro email", date: "2026-06-23", user: "Jose" }] },
  { id: 6, name: "Billy Self", title: "Owner", company: "Warehouse-Pro", email: "info@warehouse-pro.com", phone: "(800) 706-5202", city: "Rockwall, TX", stage: "Lead", tags: ["Dallas", "Large Volume", "FBA"], value: 2388, notes: "163k sq ft, 80+ employees. Sent email but bounced. Need contact form or LinkedIn.", lastContact: "2026-06-23", nextFollowUp: "2026-06-25", source: "Google Maps", invoices: [], activities: [{ id: 1, type: "email", text: "Email bounced — need to use contact form at warehouse-pro.com", date: "2026-06-23", user: "Jose" }, { id: 2, type: "note", text: "Billy Self is on LinkedIn — connect directly", date: "2026-06-23", user: "Jose" }] },
  { id: 7, name: "Jennifer", title: "Owner", company: "Fluffle Fulfillment", email: "info@flufflefulfill.com", phone: "(512) 814-8940", city: "Buda, TX", stage: "Contacted", tags: ["Austin", "LTL", "DTC"], value: 588, notes: "5.0 stars. Family run. Clients describe them as 'breath of fresh air'. Perfect beta tester profile.", lastContact: "2026-06-23", nextFollowUp: "2026-06-28", source: "Google Maps", invoices: [], activities: [{ id: 1, type: "email", text: "Sent personalized email referencing their 5-star reviews", date: "2026-06-23", user: "Jose" }] },
  { id: 8, name: "Jordan", title: "Founder", company: "3PL Bridge", email: "info@3plbridge.com", phone: "(855) 282-0544", city: "Dallas, TX", stage: "Lead", tags: ["Dallas", "Referral Partner"], value: 4800, notes: "Matchmaker for 3PLs — sent partnership pitch not standard trial. Potential referral channel.", lastContact: "2026-06-23", nextFollowUp: "2026-06-27", source: "Google Maps", invoices: [], activities: [{ id: 1, type: "email", text: "Sent partnership / referral pitch — different angle from standard trial", date: "2026-06-23", user: "Jose" }] },
];

const SEED_INVOICES = [
  { id: "INV-1001", clientId: 1, client: "Crossroads 3PL Solutions", email: "jeffkogut@crossroads3pl.com", periodStart: "2026-06-01", periodEnd: "2026-06-30", dueDate: "2026-07-15", total: 1188, status: "sent", created: "2026-06-23", lineItems: [{ desc: "Pallet storage (66 pallets)", qty: 66, rate: 18 }] },
  { id: "INV-1002", clientId: 4, client: "Simpl Fulfillment", email: "hello@simplfulfillment.com", periodStart: "2026-06-01", periodEnd: "2026-06-30", dueDate: "2026-07-15", total: 1242, status: "paid", created: "2026-06-20", lineItems: [{ desc: "Pallet storage", qty: 42, rate: 18 }, { desc: "Inbound handling", qty: 310, rate: 0.45 }, { desc: "Outbound handling", qty: 287, rate: 0.45 }] },
  { id: "INV-1003", client: "Valley Fresh Co.", email: "billing@valleyfresh.com", periodStart: "2026-05-01", periodEnd: "2026-05-31", dueDate: "2026-06-15", total: 890, status: "overdue", created: "2026-05-31", lineItems: [{ desc: "Pallet storage", qty: 40, rate: 18 }, { desc: "Inbound handling", qty: 200, rate: 0.45 }] },
];

const PIPELINE_STAGES = ["Lead", "Contacted", "Demo", "Trial", "Customer", "Churned"];
const STAGE_COLORS = { Lead: C.text3, Contacted: C.blue, Demo: C.amber, Trial: C.purple, Customer: C.green, Churned: C.red };
const ACTIVITY_ICONS = { email: "✉", call: "📞", note: "📝", meeting: "🤝", demo: "💻", follow_up: "🔔" };

// ─── STYLE HELPERS ────────────────────────────────────────────────────────────
const s = {
  app: { display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "100vh", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", fontSize: 14, color: C.text, background: C.bg },
  sidebar: { background: C.card, borderRight: `0.5px solid ${C.border}`, display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0, overflow: "hidden" },
  logo: { padding: "18px 18px 14px", borderBottom: `0.5px solid ${C.border}`, flexShrink: 0 },
  logoMark: { fontSize: 17, fontWeight: 700, letterSpacing: -0.5, color: C.text },
  logoSpan: { color: C.green },
  logoSub: { fontSize: 11, color: C.text3, marginTop: 1 },
  nav: { padding: "8px", flex: 1, overflowY: "auto" },
  navSection: { fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: 1, padding: "12px 10px 4px", fontWeight: 600 },
  navItem: (active) => ({ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, cursor: "pointer", color: active ? C.greenD : C.text2, background: active ? C.greenL : "transparent", fontWeight: active ? 600 : 400, fontSize: 13, marginBottom: 1, transition: "background 0.1s", userSelect: "none" }),
  navBadge: (color = C.green) => ({ marginLeft: "auto", background: color, color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 99 }),
  sideFooter: { padding: "14px 16px", borderTop: `0.5px solid ${C.border}`, flexShrink: 0 },
  topbar: { background: C.card, borderBottom: `0.5px solid ${C.border}`, padding: "13px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 },
  topTitle: { fontSize: 15, fontWeight: 600 },
  topSub: { fontSize: 12, color: C.text3, marginTop: 1 },
  topActions: { display: "flex", gap: 8, alignItems: "center" },
  content: { padding: 24, flex: 1, overflowY: "auto" },
  card: (mb = 14) => ({ background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: "18px 20px", marginBottom: mb, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }),
  cardHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  cardTitle: { fontSize: 13, fontWeight: 600, color: C.text, display: "flex", alignItems: "center", gap: 6 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 },
  statCard: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: "16px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  btn: (variant = "ghost", sm = false) => {
    const base = { display: "inline-flex", alignItems: "center", gap: 6, padding: sm ? "5px 10px" : "7px 14px", borderRadius: 8, fontSize: sm ? 12 : 13, fontWeight: 500, cursor: "pointer", border: "none", fontFamily: "inherit", transition: "opacity 0.1s", whiteSpace: "nowrap" };
    if (variant === "primary") return { ...base, background: C.green, color: "#fff" };
    if (variant === "danger") return { ...base, background: C.redL, color: C.red, border: `0.5px solid ${C.redB}` };
    if (variant === "stripe") return { ...base, background: C.stripe, color: "#fff" };
    if (variant === "purple") return { ...base, background: C.purpleL, color: C.purple, border: `0.5px solid #C4B5FD` };
    return { ...base, background: C.bg2, color: C.text2, border: `0.5px solid ${C.border2}` };
  },
  input: { fontFamily: "inherit", fontSize: 13.5, color: C.text, background: C.card, border: `0.5px solid ${C.border2}`, borderRadius: 8, padding: "8px 11px", outline: "none", width: "100%" },
  select: { fontFamily: "inherit", fontSize: 13, color: C.text, background: C.card, border: `0.5px solid ${C.border2}`, borderRadius: 8, padding: "7px 28px 7px 10px", outline: "none", appearance: "none", cursor: "pointer" },
  textarea: { fontFamily: "inherit", fontSize: 13, color: C.text, background: C.card, border: `0.5px solid ${C.border2}`, borderRadius: 8, padding: "8px 11px", outline: "none", width: "100%", resize: "vertical", minHeight: 68 },
  label: { fontSize: 12, color: C.text2, fontWeight: 500, marginBottom: 4, display: "block" },
  field: (mb = 12) => ({ marginBottom: mb }),
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 },
  badge: (status) => {
    const map = { draft: [C.bg2, C.text2], sent: [C.blueL, C.blue], viewed: ["#FFF7ED", "#C2410C"], paid: [C.greenL, C.greenD], overdue: [C.redL, C.red], partial: [C.amberL, C.amber], Lead: [C.bg2, C.text3], Contacted: [C.blueL, C.blue], Demo: [C.amberL, C.amber], Trial: [C.purpleL, C.purple], Customer: [C.greenL, C.greenD], Churned: [C.redL, C.red] };
    const [bg, color] = map[status] || [C.bg2, C.text2];
    return { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 99, background: bg, color, whiteSpace: "nowrap" };
  },
  pill: (color) => ({ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 99, background: color + "22", color }),
  dataTable: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  tableHead: { background: C.bg2, padding: "9px 18px", borderBottom: `0.5px solid ${C.border}`, display: "grid", gap: 12 },
  tableRow: { padding: "12px 18px", borderBottom: `0.5px solid ${C.border}`, display: "grid", gap: 12, alignItems: "center", cursor: "pointer", transition: "background 0.1s" },
  modal: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  modalBox: { background: C.card, borderRadius: 14, padding: 26, maxWidth: 520, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" },
  avatar: (size = 36, color = C.greenL) => ({ width: size, height: size, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.38, color: C.greenD, flexShrink: 0 }),
  tag: { fontSize: 11, padding: "2px 8px", borderRadius: 99, background: C.bg2, color: C.text2, fontWeight: 500 },
  pipeline: { display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10, overflowX: "auto" },
  pipelineCol: { background: C.bg2, borderRadius: 10, padding: 10, minHeight: 200 },
  pipelineCard: { background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 8, cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
  divider: { borderBottom: `0.5px solid ${C.border}`, margin: "14px 0" },
  toggleRow: { display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `0.5px solid ${C.border}` },
};

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────
const Icon = ({ name, size = 14, color }) => {
  const icons = {
    dashboard: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
    invoice: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    contacts: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
    pipeline: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="4" height="18" rx="1"/><rect x="10" y="8" width="4" height="13" rx="1"/><rect x="17" y="5" width="4" height="16" rx="1"/></svg>,
    activity: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    payment: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    portal: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
    rates: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
    settings: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/></svg>,
    plus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    send: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
    trash: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>,
    edit: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    phone: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81a2 2 0 012-2.18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L9.09 14.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
    email: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    note: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><line x1="9" y1="15" x2="15" y2="9"/></svg>,
    meeting: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/></svg>,
    alarm: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3L2 6M22 6l-3-3"/></svg>,
    search: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    lock: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
    arrow: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    close: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  };
  return <span style={{ color, display: "inline-flex" }}>{icons[name]}</span>;
};

const Btn = ({ onClick, variant = "ghost", sm = false, children, style = {} }) => (
  <button onClick={onClick} style={{ ...s.btn(variant, sm), ...style }}>{children}</button>
);

const Badge = ({ status }) => (
  <span style={s.badge(status)}>
    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", opacity: 0.7 }} />
    {status.charAt(0).toUpperCase() + status.slice(1)}
  </span>
);

const StatCard = ({ label, value, change, changeType = "neutral", prefix = "" }) => (
  <div style={s.statCard}>
    <div style={{ fontSize: 11, color: C.text3, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>{prefix}{value}</div>
    {change && <div style={{ fontSize: 12, marginTop: 3, color: changeType === "up" ? C.green : changeType === "down" ? C.red : C.text3 }}>{change}</div>}
  </div>
);

const Avatar = ({ name, size = 36 }) => {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const colors = [C.greenL, C.blueL, C.amberL, C.purpleL];
  const color = colors[name.charCodeAt(0) % colors.length];
  return <div style={s.avatar(size, color)}>{initials}</div>;
};

const Tag = ({ label }) => <span style={s.tag}>{label}</span>;

const Modal = ({ open, onClose, title, children, width = 520 }) => {
  if (!open) return null;
  return (
    <div style={s.modal} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...s.modalBox, maxWidth: width }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
          <button onClick={onClose} style={{ ...s.btn("ghost", true), padding: "4px 8px" }}><Icon name="close" size={13} /></button>
        </div>
        {children}
      </div>
    </div>
  );
};

const fmtMoney = n => "$" + Math.abs(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const fmtDate = v => { if (!v) return "—"; try { return new Date(v + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); } catch { return "—"; } };
const today = () => new Date().toISOString().split("T")[0];
const nextInvNum = (invoices) => "INV-" + String(Math.max(...invoices.map(i => parseInt(i.id.split("-")[1]) || 1000)) + 1).padStart(4, "0");

// ─── TOAST ────────────────────────────────────────────────────────────────────
const Toast = ({ msg, type, visible }) => (
  <div style={{ position: "fixed", bottom: 22, right: 22, background: type === "error" ? C.red : C.text, color: "#fff", padding: "11px 16px", borderRadius: 10, fontSize: 13.5, fontWeight: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.25)", zIndex: 9999, display: "flex", alignItems: "center", gap: 10, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(12px)", transition: "all 0.25s", pointerEvents: "none" }}>
    <span style={{ color: type === "error" ? "#FCA5A5" : C.green }}><Icon name="check" size={14} /></span>
    {msg}
  </div>
);

// ─── AUTH WRAPPER ─────────────────────────────────────────────────────────────
function AuthGate() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState("login"); // login | signup
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setAuthLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError("");
    const { error } = authMode === "login"
      ? await supabase.auth.signInWithPassword({ email: authEmail, password: authPass })
      : await supabase.auth.signUp({ email: authEmail, password: authPass });
    if (error) setAuthError(error.message);
  };

  if (authLoading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "-apple-system,sans-serif", color: C.text3 }}>Loading...</div>;

  if (!session) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", background: C.bg }}>
      <form onSubmit={handleAuth} style={{ background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: 32, width: 360, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>pallet<span style={{ color: C.green }}>bill</span></div>
        <div style={{ fontSize: 12, color: C.text3, marginBottom: 24 }}>{authMode === "login" ? "Sign in to your account" : "Create your account"}</div>
        {authError && <div style={{ background: C.redL, color: C.red, padding: "8px 12px", borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{authError}</div>}
        <div style={{ marginBottom: 14 }}><label style={{ fontSize: 12, color: C.text2, fontWeight: 500, display: "block", marginBottom: 4 }}>Email</label><input style={{ fontFamily: "inherit", fontSize: 13.5, color: C.text, background: C.card, border: `0.5px solid ${C.border2}`, borderRadius: 8, padding: "8px 11px", width: "100%", boxSizing: "border-box" }} type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required /></div>
        <div style={{ marginBottom: 20 }}><label style={{ fontSize: 12, color: C.text2, fontWeight: 500, display: "block", marginBottom: 4 }}>Password</label><input style={{ fontFamily: "inherit", fontSize: 13.5, color: C.text, background: C.card, border: `0.5px solid ${C.border2}`, borderRadius: 8, padding: "8px 11px", width: "100%", boxSizing: "border-box" }} type="password" value={authPass} onChange={e => setAuthPass(e.target.value)} required minLength={6} /></div>
        <button type="submit" style={{ width: "100%", background: C.green, color: "#fff", border: "none", padding: "10px 14px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginBottom: 12 }}>{authMode === "login" ? "Sign in" : "Create account"}</button>
        <div style={{ textAlign: "center", fontSize: 13, color: C.text3 }}>
          {authMode === "login" ? "No account? " : "Already have one? "}
          <span style={{ color: C.green, cursor: "pointer", fontWeight: 500 }} onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setAuthError(""); }}>{authMode === "login" ? "Sign up" : "Sign in"}</span>
        </div>
      </form>
    </div>
  );

  return <PalletBill session={session} />;
}

export default AuthGate;

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
function PalletBill({ session }) {
  const userId = session.user.id;
  const [view, setView] = useState("dashboard");
  const [contacts, setContacts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [providers, setProviders] = useState({ stripe: false, square: false, ach: false });
  const [dataLoaded, setDataLoaded] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "success", visible: false });
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [modal, setModal] = useState(null); // 'addContact' | 'addInvoice' | 'addActivity' | 'sendInvoice'
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [invStatusFilter, setInvStatusFilter] = useState("");
  const [lineItems, setLineItems] = useState([{ desc: "Pallet storage", qty: "", rate: "" }, { desc: "Inbound handling", qty: "", rate: "" }]);
  const [invForm, setInvForm] = useState({ clientId: "", client: "", email: "", invNum: "", invDate: today(), dueDate: "", periodStart: "", periodEnd: "", terms: "15", currency: "USD", discount: "0", tax: "0", paymentInstructions: "ACH: Routing 121000248 · Account 4829301847\nChecks payable to: Your Company LLC", terms_text: "Payment due within agreed terms. Late payments subject to 1.5% monthly interest.", notes: "" });
  const [contactForm, setContactForm] = useState({ name: "", title: "", company: "", email: "", phone: "", city: "", stage: "Lead", value: "", source: "", tags: "", notes: "" });
  const [activityForm, setActivityForm] = useState({ type: "email", text: "", date: today() });
  const [sendForm, setSendForm] = useState({ to: "", subject: "", message: "" });
  const [rateCard, setRateCard] = useState({ pallet: 18, bin: 4.5, floor: 0.45, min: 250, inUnit: 0.45, outUnit: 0.45, inPallet: 12, outPallet: 12, hazmat: 85, repack: 35, refused: 65, afterhours: 95, returns: 2.5, kitting: 0.75 });
  const [companyName, setCompanyName] = useState("Your Company LLC");
  const [companyAddress, setCompanyAddress] = useState("1234 Warehouse Blvd\nTemple, TX 76502");

  // ── LOAD DATA FROM SUPABASE ──
  useEffect(() => {
    async function loadData() {
      const [clientsRes, invoicesRes, activitiesRes, rateRes, profileRes] = await Promise.all([
        supabase.from("clients").select("*").order("created_at", { ascending: false }),
        supabase.from("invoices").select("*").order("created_at", { ascending: false }),
        supabase.from("activities").select("*").order("activity_date", { ascending: false }),
        supabase.from("rate_cards").select("*").limit(1).single(),
        supabase.from("profiles").select("*").eq("id", userId).single(),
      ]);

      const activitiesByClient = {};
      (activitiesRes.data || []).forEach(a => {
        if (!activitiesByClient[a.client_id]) activitiesByClient[a.client_id] = [];
        activitiesByClient[a.client_id].push({ id: a.id, type: a.type, text: a.text, date: a.activity_date, user: a.created_by || "Jose" });
      });

      const mappedContacts = (clientsRes.data || []).map(c => ({
        id: c.id, name: c.contact_name || c.name, title: "", company: c.name,
        email: c.email || "", phone: c.phone || "", city: c.city || "",
        stage: c.stage || "Lead", tags: c.tags || [], value: parseFloat(c.annual_value) || 0,
        notes: c.notes || "", lastContact: c.last_contact || "", nextFollowUp: c.next_follow_up || "",
        source: c.source || "", invoices: [], activities: activitiesByClient[c.id] || [],
      }));

      const mappedInvoices = (invoicesRes.data || []).map(inv => ({
        id: inv.invoice_number, dbId: inv.id, clientId: inv.client_id,
        client: inv.client_name, email: inv.client_email || "",
        periodStart: inv.period_start || "", periodEnd: inv.period_end || "",
        dueDate: inv.due_date || "", total: parseFloat(inv.total) || 0,
        status: inv.status || "draft", created: inv.issue_date || "",
        lineItems: inv.line_items || [],
        paymentLinkUrl: inv.payment_link_url || null,
      }));

      setContacts(mappedContacts);
      setInvoices(mappedInvoices);

      if (rateRes.data) {
        const r = rateRes.data;
        setRateCard({ pallet: +r.pallet_storage, bin: +r.bin_storage, floor: +r.floor_storage, min: +r.monthly_min, inUnit: +r.inbound_unit, outUnit: +r.outbound_unit, inPallet: +r.inbound_pallet, outPallet: +r.outbound_pallet, hazmat: +r.hazmat, repack: +r.repackaging, refused: +r.refused, afterhours: +r.after_hours, returns: +r.returns, kitting: +r.kitting });
      }

      if (profileRes.data) {
        setCompanyName(profileRes.data.company_name || "Your Company LLC");
        setCompanyAddress(profileRes.data.address || "1234 Warehouse Blvd\nTemple, TX 76502");
      }

      setDataLoaded(true);
    }
    loadData();
  }, [userId]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  };

  const go = (v) => { setView(v); setSelectedContact(null); setSelectedInvoice(null); };

  // ── NAV ITEMS ──
  const navGroups = [
    { section: "Main", items: [{ id: "dashboard", label: "Dashboard", icon: "dashboard" }, { id: "invoices", label: "All invoices", icon: "invoice", badge: invoices.filter(i => i.status === "overdue").length || null, badgeColor: C.red }, { id: "newInvoice", label: "New invoice", icon: "plus" }] },
    { section: "CRM", items: [{ id: "contacts", label: "Contacts", icon: "contacts", badge: contacts.length }, { id: "pipeline", label: "Pipeline", icon: "pipeline" }, { id: "activity", label: "Activity feed", icon: "activity" }] },
    { section: "Get Paid", items: [{ id: "payments", label: "Payment connections", icon: "payment" }, { id: "portal", label: "Client portal", icon: "portal" }] },
    { section: "Setup", items: [{ id: "rates", label: "Rate card", icon: "rates" }, { id: "settings", label: "Settings", icon: "settings" }] },
  ];

  // ── COMPUTED ──
  const overdueCnt = invoices.filter(i => i.status === "overdue").length;
  const outstanding = invoices.filter(i => ["sent", "viewed", "overdue"].includes(i.status)).reduce((s, i) => s + i.total, 0);
  const collected = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const pipeline_value = contacts.filter(c => !["Customer", "Churned"].includes(c.stage)).reduce((s, c) => s + (c.value || 0), 0);
  const trialCount = contacts.filter(c => c.stage === "Trial").length;
  const customerCount = contacts.filter(c => c.stage === "Customer").length;

  const filteredContacts = useMemo(() => contacts.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.company.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchStage = !stageFilter || c.stage === stageFilter;
    return matchSearch && matchStage;
  }), [contacts, search, stageFilter]);

  const filteredInvoices = useMemo(() => invoices.filter(i => {
    const matchSearch = !search || i.id.toLowerCase().includes(search.toLowerCase()) || i.client.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !invStatusFilter || i.status === invStatusFilter;
    return matchSearch && matchStatus;
  }), [invoices, search, invStatusFilter]);

  const allActivities = useMemo(() => {
    return contacts.flatMap(c => (c.activities || []).map(a => ({ ...a, contact: c.name, company: c.company, contactId: c.id }))).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [contacts]);

  // ── ACTIONS ──
  const markPaid = async (id) => {
    const inv = invoices.find(i => i.id === id);
    if (inv?.dbId) await supabase.from("invoices").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", inv.dbId);
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: "paid" } : i));
    showToast(`${id} marked as paid`);
  };

  const saveContact = async () => {
    if (!contactForm.name || !contactForm.email) { showToast("Name and email required", "error"); return; }
    const tags = contactForm.tags.split(",").map(t => t.trim()).filter(Boolean);
    const { data, error } = await supabase.from("clients").insert({
      user_id: userId, name: contactForm.company || contactForm.name, contact_name: contactForm.name,
      email: contactForm.email, phone: contactForm.phone, city: contactForm.city,
      stage: contactForm.stage, source: contactForm.source, tags,
      annual_value: parseFloat(contactForm.value) || 0, notes: contactForm.notes,
      next_follow_up: contactForm.nextFollowUp || null, last_contact: today(),
    }).select().single();
    if (error) { showToast(error.message, "error"); return; }
    const newC = { id: data.id, name: contactForm.name, title: contactForm.title, company: contactForm.company, email: contactForm.email, phone: contactForm.phone, city: contactForm.city, stage: contactForm.stage, value: parseFloat(contactForm.value) || 0, tags, source: contactForm.source, notes: contactForm.notes, activities: [], invoices: [], lastContact: today(), nextFollowUp: contactForm.nextFollowUp || "" };
    setContacts(prev => [newC, ...prev]);
    setModal(null);
    setContactForm({ name: "", title: "", company: "", email: "", phone: "", city: "", stage: "Lead", value: "", source: "", tags: "", notes: "" });
    showToast("Contact added");
  };

  const updateContactStage = async (id, stage) => {
    await supabase.from("clients").update({ stage }).eq("id", id);
    setContacts(prev => prev.map(c => c.id === id ? { ...c, stage } : c));
    showToast(`Stage updated to ${stage}`);
  };

  const addActivity = async (contactId) => {
    if (!activityForm.text) { showToast("Enter activity details", "error"); return; }
    const { data, error } = await supabase.from("activities").insert({
      user_id: userId, client_id: contactId, type: activityForm.type,
      text: activityForm.text, activity_date: activityForm.date, created_by: "Jose",
    }).select().single();
    if (error) { showToast(error.message, "error"); return; }
    const act = { id: data.id, type: activityForm.type, text: activityForm.text, date: activityForm.date, user: "Jose" };
    await supabase.from("clients").update({ last_contact: today() }).eq("id", contactId);
    setContacts(prev => prev.map(c => c.id === contactId ? { ...c, activities: [act, ...(c.activities || [])], lastContact: today() } : c));
    setModal(null);
    setActivityForm({ type: "email", text: "", date: today() });
    showToast("Activity logged");
  };

  const deleteContact = async (id) => {
    await supabase.from("clients").delete().eq("id", id);
    setContacts(prev => prev.filter(c => c.id !== id));
    setSelectedContact(null);
    showToast("Contact deleted");
  };

  // ── INVOICE CALC ──
  const calcTotals = useCallback(() => {
    const sub = lineItems.reduce((s, i) => s + (parseFloat(i.qty) || 0) * (parseFloat(i.rate) || 0), 0);
    const disc = sub * (parseFloat(invForm.discount) || 0) / 100;
    const tax = (sub - disc) * (parseFloat(invForm.tax) || 0) / 100;
    return { sub, disc, tax, total: sub - disc + tax };
  }, [lineItems, invForm.discount, invForm.tax]);

  const saveInvoice = async (status = "draft") => {
    if (!invForm.client) { showToast("Add client name", "error"); return; }
    const { sub, disc, tax, total } = calcTotals();
    const invNum = invForm.invNum || nextInvNum(invoices);

    // Create Stripe payment link if sending and Stripe is connected
    let paymentLinkUrl = null;
    if (status === "sent" && providers.stripe) {
      try {
        showToast("Creating payment link...");
        const apiBase = import.meta.env.VITE_API_URL || "";
        const res = await fetch(`${apiBase}/.netlify/functions/create-payment-link`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invoiceNumber: invNum,
            clientName: invForm.client,
            clientEmail: invForm.email,
            lineItems,
            totalCents: Math.round(total * 100),
            dueDate: invForm.dueDate,
            companyName,
          }),
        });
        if (res.ok) {
          const linkData = await res.json();
          paymentLinkUrl = linkData.paymentLinkUrl;
        } else {
          const errData = await res.json().catch(() => ({}));
          console.error("Stripe payment link error:", errData);
          showToast("Payment link failed — invoice saved without it", "error");
        }
      } catch (err) {
        console.error("Payment link fetch error:", err);
      }
    }

    const { data, error } = await supabase.from("invoices").insert({
      user_id: userId, client_id: invForm.clientId || null, invoice_number: invNum,
      client_name: invForm.client, client_email: invForm.email,
      period_start: invForm.periodStart || null, period_end: invForm.periodEnd || null,
      due_date: invForm.dueDate || null, issue_date: invForm.invDate || today(),
      subtotal: sub, discount_pct: parseFloat(invForm.discount) || 0,
      tax_pct: parseFloat(invForm.tax) || 0, total, currency: invForm.currency,
      status, line_items: lineItems, notes: invForm.notes,
      terms: invForm.terms_text, payment_instructions: invForm.paymentInstructions,
      payment_link_url: paymentLinkUrl,
    }).select().single();
    if (error) { showToast(error.message, "error"); return; }
    const inv = { id: invNum, dbId: data.id, client: invForm.client, email: invForm.email, clientId: invForm.clientId || null, periodStart: invForm.periodStart, periodEnd: invForm.periodEnd, dueDate: invForm.dueDate, total, status, created: today(), lineItems: [...lineItems], paymentLinkUrl };
    setInvoices(prev => [inv, ...prev]);
    if (status === "sent") {
      if (invForm.clientId) {
        const actText = paymentLinkUrl
          ? `Invoice ${invNum} sent — ${fmtMoney(total)} — payment link created`
          : `Invoice ${invNum} sent — ${fmtMoney(total)}`;
        const { data: actData } = await supabase.from("activities").insert({
          user_id: userId, client_id: invForm.clientId, type: "email",
          text: actText, activity_date: today(), created_by: "Jose",
        }).select().single();
        const act = { id: actData?.id || Date.now(), type: "email", text: actText, date: today(), user: "Jose" };
        setContacts(prev => prev.map(c => c.id === invForm.clientId ? { ...c, activities: [act, ...(c.activities || [])], invoices: [...(c.invoices || []), invNum] } : c));
      }
      showToast(paymentLinkUrl ? `Invoice sent with payment link` : `Invoice sent to ${invForm.email}`);
    } else {
      showToast("Draft saved");
    }
    go("invoices");
  };

  // ── VIEWS ──

  // Dashboard
  const renderDashboard = () => (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ padding: 24 }}>
        <div style={s.statsGrid}>
          <StatCard label="Outstanding" value={fmtMoney(outstanding)} change={`${invoices.filter(i => ["sent", "viewed"].includes(i.status)).length} pending invoices`} />
          <StatCard label="Collected" value={fmtMoney(collected)} change="↑ 8% vs last month" changeType="up" />
          <StatCard label="Pipeline value" value={fmtMoney(pipeline_value)} change={`${contacts.filter(c => c.stage === "Trial").length} in trial`} changeType="up" />
          <StatCard label="Contacts" value={contacts.length} change={`${customerCount} customers · ${trialCount} in trial`} />
        </div>

        {overdueCnt > 0 && (
          <div style={{ background: C.redL, border: `0.5px solid ${C.redB}`, borderRadius: 10, padding: "12px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <span style={{ color: C.red, fontWeight: 500 }}>{overdueCnt} overdue invoice{overdueCnt > 1 ? "s" : ""} — {fmtMoney(invoices.filter(i => i.status === "overdue").reduce((s, i) => s + i.total, 0))} outstanding</span>
            <Btn sm onClick={() => go("invoices")} style={{ marginLeft: "auto" }}>View overdue →</Btn>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Recent invoices</div>
              <Btn sm onClick={() => go("invoices")}>See all →</Btn>
            </div>
            <div style={s.dataTable}>
              {invoices.slice(0, 5).map((inv, i) => (
                <div key={inv.id} style={{ ...s.tableRow, gridTemplateColumns: "1fr auto auto", borderBottom: i < 4 ? `0.5px solid ${C.border}` : "none" }} onClick={() => setSelectedInvoice(inv)}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{inv.id}</div>
                    <div style={{ fontSize: 12, color: C.text2 }}>{inv.client}</div>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{fmtMoney(inv.total)}</div>
                  <Badge status={inv.status} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Recent contacts</div>
              <Btn sm onClick={() => go("contacts")}>See all →</Btn>
            </div>
            <div style={s.dataTable}>
              {contacts.slice(0, 5).map((c, i) => (
                <div key={c.id} style={{ ...s.tableRow, gridTemplateColumns: "auto 1fr auto", borderBottom: i < 4 ? `0.5px solid ${C.border}` : "none" }} onClick={() => { setSelectedContact(c); go("contacts"); }}>
                  <Avatar name={c.name} size={32} />
                  <div style={{ marginLeft: 10 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: C.text2 }}>{c.company}</div>
                  </div>
                  <Badge status={c.stage} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Follow-ups due</div>
          <div style={s.dataTable}>
            {contacts.filter(c => c.nextFollowUp).sort((a, b) => new Date(a.nextFollowUp) - new Date(b.nextFollowUp)).slice(0, 4).map((c, i, arr) => (
              <div key={c.id} style={{ ...s.tableRow, gridTemplateColumns: "auto 1fr auto auto", borderBottom: i < arr.length - 1 ? `0.5px solid ${C.border}` : "none" }} onClick={() => { setSelectedContact(c); go("contacts"); }}>
                <span style={{ fontSize: 16, marginRight: 4 }}>🔔</span>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{c.name} — {c.company}</div>
                  <div style={{ fontSize: 12, color: C.text2 }}>{c.notes?.slice(0, 60)}...</div>
                </div>
                <div style={{ fontSize: 12, color: new Date(c.nextFollowUp) < new Date() ? C.red : C.text3 }}>{fmtDate(c.nextFollowUp)}</div>
                <Badge status={c.stage} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Contacts list
  const renderContacts = () => {
    if (selectedContact) return renderContactDetail(selectedContact);
    return (
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ padding: 24 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
              <input style={{ ...s.input, paddingLeft: 32, fontSize: 13 }} placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} />
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.text3 }}><Icon name="search" size={13} /></span>
            </div>
            <select style={s.select} value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
              <option value="">All stages</option>
              {PIPELINE_STAGES.map(st => <option key={st}>{st}</option>)}
            </select>
            <div style={{ flex: 1 }} />
            <Btn variant="primary" onClick={() => setModal("addContact")}><Icon name="plus" size={13} />Add contact</Btn>
          </div>

          <div style={s.dataTable}>
            <div style={{ ...s.tableHead, gridTemplateColumns: "auto 1.8fr 1.2fr 1fr 80px 110px 80px" }}>
              <span />
              <span>Contact</span><span>Company</span><span>Email</span><span>Stage</span><span>Value</span><span>Last contact</span>
            </div>
            {filteredContacts.length ? filteredContacts.map((c, i) => (
              <div key={c.id} style={{ ...s.tableRow, gridTemplateColumns: "auto 1.8fr 1.2fr 1fr 80px 110px 80px", borderBottom: i < filteredContacts.length - 1 ? `0.5px solid ${C.border}` : "none" }} onClick={() => setSelectedContact(c)}>
                <Avatar name={c.name} size={30} />
                <div style={{ marginLeft: 8 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div><div style={{ fontSize: 12, color: C.text2 }}>{c.title}</div></div>
                <div style={{ fontSize: 13 }}>{c.company}</div>
                <div style={{ fontSize: 12, color: C.text2 }}>{c.email}</div>
                <Badge status={c.stage} />
                <div style={{ fontSize: 13, fontWeight: 600 }}>{c.value ? fmtMoney(c.value) + "/yr" : "—"}</div>
                <div style={{ fontSize: 12, color: C.text3 }}>{fmtDate(c.lastContact)}</div>
              </div>
            )) : (
              <div style={{ padding: "32px 20px", textAlign: "center", color: C.text3 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
                <div style={{ fontWeight: 600, color: C.text2, marginBottom: 4 }}>No contacts found</div>
                <div style={{ fontSize: 13 }}>Add your first contact or adjust filters</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContactDetail = (c) => (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <Btn sm onClick={() => setSelectedContact(null)}>← Back</Btn>
          <div style={{ flex: 1 }} />
          <select style={{ ...s.select, fontSize: 12 }} value={c.stage} onChange={e => { updateContactStage(c.id, e.target.value); setSelectedContact({ ...c, stage: e.target.value }); }}>
            {PIPELINE_STAGES.map(st => <option key={st}>{st}</option>)}
          </select>
          <Btn sm onClick={() => { setSelectedContact(null); setInvForm(f => ({ ...f, clientId: c.id, client: c.company || c.name, email: c.email, invNum: nextInvNum(invoices) })); go("newInvoice"); }}>+ Invoice</Btn>
          <Btn sm variant="danger" onClick={() => deleteContact(c.id)}><Icon name="trash" size={12} /></Btn>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 16, alignItems: "start" }}>
          {/* LEFT: profile */}
          <div>
            <div style={s.card()}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingBottom: 16, borderBottom: `0.5px solid ${C.border}`, marginBottom: 16 }}>
                <Avatar name={c.name} size={56} />
                <div style={{ marginTop: 12, fontSize: 17, fontWeight: 700 }}>{c.name}</div>
                <div style={{ fontSize: 13, color: C.text2, marginTop: 2 }}>{c.title}</div>
                <div style={{ fontSize: 13, color: C.text3 }}>{c.company}</div>
                <div style={{ marginTop: 10 }}><Badge status={c.stage} /></div>
              </div>
              {[{ icon: "email", val: c.email }, { icon: "phone", val: c.phone }, { icon: "note", val: c.city }].map(({ icon, val }) => val && (
                <div key={icon} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ color: C.text3 }}><Icon name={icon} size={13} /></span>
                  <span style={{ fontSize: 13, color: C.text }}>{val}</span>
                </div>
              ))}
              {c.tags?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                  {c.tags.map(t => <Tag key={t} label={t} />)}
                </div>
              )}
            </div>

            <div style={s.card()}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.6 }}>Deal info</div>
              {[["Annual value", c.value ? fmtMoney(c.value) : "—"], ["Source", c.source || "—"], ["Last contact", fmtDate(c.lastContact)], ["Follow-up", fmtDate(c.nextFollowUp)]].map(([label, val]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                  <span style={{ color: C.text2 }}>{label}</span>
                  <span style={{ fontWeight: 500 }}>{val}</span>
                </div>
              ))}
            </div>

            {c.invoices?.length > 0 && (
              <div style={s.card()}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.6 }}>Invoices</div>
                {invoices.filter(i => c.invoices.includes(i.id)).map(inv => (
                  <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{inv.id}</span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{fmtMoney(inv.total)}</span>
                      <Badge status={inv.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {c.notes && (
              <div style={s.card()}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text2, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.6 }}>Notes</div>
                <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.6 }}>{c.notes}</div>
              </div>
            )}
          </div>

          {/* RIGHT: activity */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Activity</div>
              <div style={{ display: "flex", gap: 8 }}>
                {[{ type: "email", label: "Email" }, { type: "call", label: "Call" }, { type: "note", label: "Note" }, { type: "meeting", label: "Meeting" }].map(({ type, label }) => (
                  <Btn key={type} sm onClick={() => { setActivityForm({ type, text: "", date: today() }); setModal("addActivity"); setSelectedContact(c); }}>+ {label}</Btn>
                ))}
              </div>
            </div>

            <div style={s.card(0)}>
              {(c.activities || []).length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center", color: C.text3, fontSize: 13 }}>No activity yet. Log a call, email, or note to get started.</div>
              ) : (c.activities || []).map((act, i) => (
                <div key={act.id} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: i < c.activities.length - 1 ? `0.5px solid ${C.border}` : "none" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.bg2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                    {ACTIVITY_ICONS[act.type] || "📝"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.text2, textTransform: "capitalize" }}>{act.type}</span>
                      <span style={{ fontSize: 11, color: C.text3 }}>by {act.user}</span>
                    </div>
                    <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{act.text}</div>
                  </div>
                  <div style={{ fontSize: 11, color: C.text3, flexShrink: 0 }}>{fmtDate(act.date)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Pipeline
  const renderPipeline = () => (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Pipeline — {fmtMoney(pipeline_value)} total value</div>
          <div style={{ flex: 1 }} />
          <Btn variant="primary" sm onClick={() => setModal("addContact")}><Icon name="plus" size={12} />Add contact</Btn>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10, overflowX: "auto" }}>
          {PIPELINE_STAGES.map(stage => {
            const stageContacts = contacts.filter(c => c.stage === stage);
            const stageVal = stageContacts.reduce((s, c) => s + (c.value || 0), 0);
            return (
              <div key={stage} style={{ background: C.bg2, borderRadius: 10, padding: 10, minWidth: 160 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: STAGE_COLORS[stage] }}>{stage}</div>
                    <div style={{ fontSize: 11, color: C.text3 }}>{stageContacts.length} · {fmtMoney(stageVal)}</div>
                  </div>
                </div>
                {stageContacts.map(c => (
                  <div key={c.id} style={{ background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 8, cursor: "pointer", borderLeft: `3px solid ${STAGE_COLORS[stage]}` }} onClick={() => { setSelectedContact(c); go("contacts"); }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: C.text2, marginBottom: 6 }}>{c.company}</div>
                    {c.value > 0 && <div style={{ fontSize: 12, fontWeight: 600, color: C.green }}>{fmtMoney(c.value)}/yr</div>}
                    {c.nextFollowUp && <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>Follow up {fmtDate(c.nextFollowUp)}</div>}
                    {c.tags?.slice(0, 2).map(t => <span key={t} style={{ ...s.tag, fontSize: 10, marginRight: 4, marginTop: 4, display: "inline-block" }}>{t}</span>)}
                  </div>
                ))}
                {stageContacts.length === 0 && <div style={{ fontSize: 12, color: C.text3, textAlign: "center", padding: "12px 0" }}>Empty</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Activity feed
  const renderActivity = () => (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ padding: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>All activity — {allActivities.length} entries</div>
        <div style={s.card(0)}>
          {allActivities.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: C.text3 }}>No activity logged yet. Go to a contact and log a call, email, or note.</div>
          ) : allActivities.map((act, i) => (
            <div key={act.id} style={{ display: "flex", gap: 14, padding: "12px 20px", borderBottom: i < allActivities.length - 1 ? `0.5px solid ${C.border}` : "none" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.bg2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{ACTIVITY_ICONS[act.type] || "📝"}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{act.contact}</span>
                  <span style={{ fontSize: 12, color: C.text3 }}>{act.company}</span>
                  <span style={{ fontSize: 11, color: C.text3, textTransform: "capitalize" }}>· {act.type}</span>
                </div>
                <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.5 }}>{act.text}</div>
              </div>
              <div style={{ fontSize: 11, color: C.text3, flexShrink: 0 }}>{fmtDate(act.date)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Invoices
  const renderInvoices = () => {
    if (selectedInvoice) {
      const inv = selectedInvoice;
      return (
        <div style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ padding: 24 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <Btn sm onClick={() => setSelectedInvoice(null)}>← Back</Btn>
              <div style={{ flex: 1 }} />
              {inv.status !== "paid" && <Btn sm variant="primary" onClick={() => { markPaid(inv.id); setSelectedInvoice({ ...inv, status: "paid" }); }}>Mark paid</Btn>}
              {inv.paymentLinkUrl && inv.status !== "paid" && <Btn sm variant="stripe" onClick={() => { navigator.clipboard.writeText(inv.paymentLinkUrl); showToast("Payment link copied!"); }}>Copy payment link</Btn>}
            </div>
            <div style={{ maxWidth: 640, margin: "0 auto" }}>
              <div style={{ background: C.card, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: "32px 36px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                <div style={{ background: inv.status === "paid" ? C.greenL : inv.status === "overdue" ? C.redL : C.bg2, borderRadius: 8, padding: "10px 14px", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: inv.status === "paid" ? C.green : inv.status === "overdue" ? C.red : C.text3 }} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: inv.status === "paid" ? C.greenD : inv.status === "overdue" ? C.red : C.text2 }}>{inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                  <div><div style={{ fontSize: 18, fontWeight: 700 }}>{companyName}</div><div style={{ fontSize: 12, color: C.text2, marginTop: 3, lineHeight: 1.6 }}>{companyAddress.replace(/\n/g, " · ")}</div></div>
                  <div style={{ textAlign: "right" }}><div style={{ fontSize: 24, fontWeight: 700, color: C.green, letterSpacing: -1 }}>INVOICE</div><div style={{ fontSize: 12, color: C.text3 }}>{inv.id}</div></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20, paddingBottom: 20, borderBottom: `0.5px solid ${C.border}` }}>
                  <div><div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Bill to</div><div style={{ fontSize: 13, fontWeight: 600 }}>{inv.client}</div><div style={{ fontSize: 12, color: C.text2 }}>{inv.email}</div></div>
                  <div style={{ textAlign: "right" }}><div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Payment due</div><div style={{ fontSize: 13, fontWeight: 700 }}>{fmtDate(inv.dueDate)}</div></div>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
                  <thead><tr>{["Description", "Qty", "Rate", "Amount"].map(h => <th key={h} style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8, color: C.text3, padding: "0 0 8px", borderBottom: `0.5px solid ${C.border}`, textAlign: h === "Amount" ? "right" : "left", fontWeight: 500 }}>{h}</th>)}</tr></thead>
                  <tbody>{(inv.lineItems || []).map((li, i) => { const amt = (parseFloat(li.qty) || 0) * (parseFloat(li.rate) || 0); return (<tr key={i}><td style={{ padding: "9px 0", borderBottom: `0.5px solid ${C.border}`, fontSize: 13 }}>{li.desc}</td><td style={{ padding: "9px 0", borderBottom: `0.5px solid ${C.border}`, fontSize: 13 }}>{li.qty}</td><td style={{ padding: "9px 0", borderBottom: `0.5px solid ${C.border}`, fontSize: 13 }}>{fmtMoney(li.rate || 0)}</td><td style={{ padding: "9px 0", borderBottom: `0.5px solid ${C.border}`, fontSize: 13, textAlign: "right", fontWeight: 500 }}>{fmtMoney(amt)}</td></tr>); })}</tbody>
                </table>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ textAlign: "right" }}><div style={{ fontSize: 20, fontWeight: 700, color: C.greenD }}>{fmtMoney(inv.total)}</div><div style={{ fontSize: 12, color: C.text3, marginTop: 2 }}>Total due</div></div>
                </div>
                {inv.paymentLinkUrl && (
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: `0.5px solid ${C.border}` }}>
                    <div style={{ background: "#635BFF12", border: "1px solid #635BFF33", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#4338CA", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span>💳 <strong>Payment link active</strong> — client can pay via card or ACH</span>
                      <button onClick={() => { navigator.clipboard.writeText(inv.paymentLinkUrl); showToast("Payment link copied!"); }} style={{ background: C.stripe, color: "#fff", border: "none", padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Copy link</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ padding: 24 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, maxWidth: 260 }}>
              <input style={{ ...s.input, paddingLeft: 32, fontSize: 13 }} placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} />
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.text3 }}><Icon name="search" size={13} /></span>
            </div>
            <select style={s.select} value={invStatusFilter} onChange={e => setInvStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              {["draft", "sent", "viewed", "paid", "overdue"].map(s => <option key={s}>{s}</option>)}
            </select>
            <div style={{ flex: 1 }} />
          </div>
          <div style={s.dataTable}>
            <div style={{ ...s.tableHead, gridTemplateColumns: "90px 1.6fr 1fr 80px 95px 110px 80px" }}>
              <span>Invoice</span><span>Client</span><span>Period</span><span>Due</span><span>Amount</span><span>Status</span><span style={{ textAlign: "right" }}>Actions</span>
            </div>
            {filteredInvoices.length ? filteredInvoices.map((inv, i) => {
              const period = inv.periodStart && inv.periodEnd ? `${fmtDate(inv.periodStart)} – ${fmtDate(inv.periodEnd)}` : "—";
              return (
                <div key={inv.id} style={{ ...s.tableRow, gridTemplateColumns: "90px 1.6fr 1fr 80px 95px 110px 80px", borderBottom: i < filteredInvoices.length - 1 ? `0.5px solid ${C.border}` : "none" }} onClick={() => setSelectedInvoice(inv)}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{inv.id}</span>
                  <span style={{ fontSize: 13 }}>{inv.client}</span>
                  <span style={{ fontSize: 12, color: C.text2 }}>{period}</span>
                  <span style={{ fontSize: 12, color: C.text2 }}>{fmtDate(inv.dueDate)}</span>
                  <span style={{ fontWeight: 600 }}>{fmtMoney(inv.total)}</span>
                  <Badge status={inv.status} />
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }} onClick={e => e.stopPropagation()}>
                    {inv.status !== "paid" && <button onClick={() => markPaid(inv.id)} style={{ ...s.btn("ghost", true), padding: "4px 8px" }} title="Mark paid"><Icon name="check" size={12} /></button>}
                    <button onClick={() => showToast(`Invoice ${inv.id} resent`)} style={{ ...s.btn("ghost", true), padding: "4px 8px" }} title="Resend"><Icon name="send" size={12} /></button>
                  </div>
                </div>
              );
            }) : <div style={{ padding: 32, textAlign: "center", color: C.text3 }}>No invoices found</div>}
          </div>
        </div>
      </div>
    );
  };

  // New Invoice
  const renderNewInvoice = () => {
    const { sub, disc, tax, total } = calcTotals();
    const currSym = { USD: "$", EUR: "€", CAD: "C$", MXN: "MX$" }[invForm.currency] || "$";
    const updateLI = (i, field, val) => { const updated = [...lineItems]; updated[i] = { ...updated[i], [field]: val }; setLineItems(updated); };
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", flex: 1, minHeight: 0, overflow: "hidden" }}>
        {/* FORM */}
        <div style={{ padding: 22, overflowY: "auto", borderRight: `0.5px solid ${C.border}`, background: C.bg }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>New invoice</div>
            <Btn sm onClick={() => go("invoices")}>← Back</Btn>
          </div>

          {/* Client */}
          <div style={s.card()}>
            <div style={{ ...s.cardHeader, marginBottom: 12 }}>
              <div style={s.cardTitle}>Bill to</div>
              <select style={{ ...s.select, fontSize: 12, width: 180 }} value={invForm.clientId || ""} onChange={e => { const c = contacts.find(c => c.id == e.target.value); if (c) setInvForm(f => ({ ...f, clientId: c.id, client: c.company || c.name, email: c.email })); }}>
                <option value="">— Load saved contact —</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
              </select>
            </div>
            <div style={s.formGrid}>
              <div style={{ ...s.field(), gridColumn: "1/-1" }}><label style={s.label}>Company name *</label><input style={s.input} value={invForm.client} onChange={e => setInvForm(f => ({ ...f, client: e.target.value }))} placeholder="Fresno Naturals LLC" /></div>
              <div style={s.field()}><label style={s.label}>Contact email *</label><input style={s.input} type="email" value={invForm.email} onChange={e => setInvForm(f => ({ ...f, email: e.target.value }))} placeholder="billing@company.com" /></div>
              <div style={s.field()}><label style={s.label}>Invoice number</label><input style={s.input} value={invForm.invNum} onChange={e => setInvForm(f => ({ ...f, invNum: e.target.value }))} /></div>
            </div>
            <div style={s.formGrid}>
              <div style={s.field()}><label style={s.label}>Invoice date</label><input style={s.input} type="date" value={invForm.invDate} onChange={e => setInvForm(f => ({ ...f, invDate: e.target.value }))} /></div>
              <div style={s.field()}><label style={s.label}>Payment terms</label><select style={s.select} value={invForm.terms} onChange={e => { const days = parseInt(e.target.value); const due = new Date(invForm.invDate + "T00:00:00"); due.setDate(due.getDate() + days); setInvForm(f => ({ ...f, terms: e.target.value, dueDate: due.toISOString().split("T")[0] })); }}><option value="0">Due on receipt</option><option value="15">Net 15</option><option value="30">Net 30</option><option value="45">Net 45</option><option value="60">Net 60</option></select></div>
              <div style={s.field()}><label style={s.label}>Period start</label><input style={s.input} type="date" value={invForm.periodStart} onChange={e => setInvForm(f => ({ ...f, periodStart: e.target.value }))} /></div>
              <div style={s.field()}><label style={s.label}>Period end</label><input style={s.input} type="date" value={invForm.periodEnd} onChange={e => setInvForm(f => ({ ...f, periodEnd: e.target.value }))} /></div>
              <div style={s.field()}><label style={s.label}>Due date</label><input style={s.input} type="date" value={invForm.dueDate} onChange={e => setInvForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
              <div style={s.field()}><label style={s.label}>Currency</label><select style={s.select} value={invForm.currency} onChange={e => setInvForm(f => ({ ...f, currency: e.target.value }))}><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option><option value="CAD">CAD (C$)</option></select></div>
            </div>
          </div>

          {/* Line items */}
          <div style={s.card()}>
            <div style={{ ...s.cardHeader, marginBottom: 10 }}>
              <div style={s.cardTitle}>Line items</div>
              <select style={{ ...s.select, fontSize: 12, width: 160 }} onChange={e => { const item = RATE_ITEMS[parseInt(e.target.value)]; if (!item) return; const rate = rateCard[item.rateKey] || 0; setLineItems(prev => [...prev, { desc: item.desc, qty: "1", rate: rate.toString() }]); e.target.value = ""; }}>
                <option value="">+ From rate card</option>
                {RATE_ITEMS.map((r, i) => <option key={i} value={i}>{r.label}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 70px 90px 90px 30px", gap: 6, marginBottom: 8, paddingBottom: 6, borderBottom: `0.5px solid ${C.border}` }}>
              {["Description", "Qty", "Rate", "Amount", ""].map(h => <span key={h} style={{ fontSize: 11, color: C.text3, textTransform: "uppercase", letterSpacing: 0.6 }}>{h}</span>)}
            </div>
            {lineItems.map((li, i) => {
              const amt = (parseFloat(li.qty) || 0) * (parseFloat(li.rate) || 0);
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 70px 90px 90px 30px", gap: 6, marginBottom: 6, alignItems: "center" }}>
                  <input style={{ ...s.input, padding: "7px 10px", fontSize: 13 }} value={li.desc} onChange={e => updateLI(i, "desc", e.target.value)} placeholder="Service description" />
                  <input style={{ ...s.input, padding: "7px 10px", fontSize: 13 }} type="number" value={li.qty} onChange={e => updateLI(i, "qty", e.target.value)} placeholder="0" />
                  <input style={{ ...s.input, padding: "7px 10px", fontSize: 13 }} type="number" value={li.rate} onChange={e => updateLI(i, "rate", e.target.value)} placeholder="0.00" step="0.01" />
                  <div style={{ fontSize: 13, fontWeight: 600, textAlign: "right", padding: "7px 4px" }}>{currSym}{amt.toFixed(2)}</div>
                  <button onClick={() => setLineItems(prev => prev.filter((_, j) => j !== i))} style={{ width: 26, height: 26, borderRadius: 6, border: "none", background: "transparent", color: C.text3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="trash" size={12} /></button>
                </div>
              );
            })}
            <button onClick={() => setLineItems(prev => [...prev, { desc: "", qty: "", rate: "" }])} style={{ display: "flex", alignItems: "center", gap: 6, color: C.green, fontSize: 13, fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: "8px 0", marginTop: 4, fontFamily: "inherit" }}><Icon name="plus" size={13} />Add line item</button>
            <div style={{ marginTop: 12, borderTop: `0.5px solid ${C.border}`, paddingTop: 12 }}>
              {[["Subtotal", currSym + sub.toFixed(2)], [`Discount (${invForm.discount}%)`, disc > 0 ? `−${currSym}${disc.toFixed(2)}` : `−${currSym}0.00`], [`Tax (${invForm.tax}%)`, currSym + tax.toFixed(2)]].map(([label, val]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}>
                  <span style={{ color: C.text2 }}>{label}</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {label.startsWith("Discount") && <input type="number" value={invForm.discount} onChange={e => setInvForm(f => ({ ...f, discount: e.target.value }))} style={{ width: 48, padding: "3px 6px", fontSize: 12, border: `0.5px solid ${C.border2}`, borderRadius: 6, fontFamily: "inherit" }} min="0" max="100" />}
                    {label.startsWith("Tax") && <input type="number" value={invForm.tax} onChange={e => setInvForm(f => ({ ...f, tax: e.target.value }))} style={{ width: 48, padding: "3px 6px", fontSize: 12, border: `0.5px solid ${C.border2}`, borderRadius: 6, fontFamily: "inherit" }} min="0" max="30" step="0.1" />}
                    <span>{val}</span>
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700, padding: "10px 0", borderTop: `0.5px solid ${C.border}`, marginTop: 6, color: C.greenD }}>
                <span>Total due</span><span>{currSym}{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div style={{ ...s.card(), marginBottom: 0 }}>
            <div style={s.field(10)}><label style={s.label}>Payment instructions</label><textarea style={s.textarea} value={invForm.paymentInstructions} onChange={e => setInvForm(f => ({ ...f, paymentInstructions: e.target.value }))} rows={3} /></div>
            <div style={s.field(10)}><label style={s.label}>Notes to client</label><textarea style={{ ...s.textarea, minHeight: 50 }} value={invForm.notes} onChange={e => setInvForm(f => ({ ...f, notes: e.target.value }))} placeholder="Thank you for your business." rows={2} /></div>
            <div style={s.field(0)}><label style={s.label}>Terms & conditions</label><textarea style={{ ...s.textarea, minHeight: 50 }} value={invForm.terms_text} onChange={e => setInvForm(f => ({ ...f, terms_text: e.target.value }))} rows={2} /></div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            <Btn variant="primary" onClick={() => saveInvoice("sent")}><Icon name="send" size={13} />Send invoice</Btn>
            <Btn onClick={() => saveInvoice("draft")}>Save draft</Btn>
            <Btn onClick={() => window.print()}>Print / PDF</Btn>
          </div>
        </div>

        {/* PREVIEW */}
        <div style={{ overflowY: "auto", background: C.bg2, padding: 24 }}>
          <div style={{ fontSize: 11, color: C.text3, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 16 }}>Live preview</div>
          <div style={{ background: "#fff", border: `0.5px solid ${C.border}`, borderRadius: 14, padding: "28px 32px", maxWidth: 580, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
            <div style={{ background: C.bg2, borderRadius: 8, padding: "9px 13px", marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.text3 }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: C.text2 }}>Draft — not yet sent</span>
            </div>
            {Object.values(providers).some(Boolean) && (
              <div style={{ background: "#635BFF12", border: "1px solid #635BFF33", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#4338CA" }}>
                💳 <strong>Pay online:</strong> pay.pallettbill.com/inv/{invForm.invNum || "INV-XXXX"}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div><div style={{ fontSize: 17, fontWeight: 700 }}>{companyName}</div><div style={{ fontSize: 12, color: C.text2, marginTop: 3, lineHeight: 1.6 }}>{companyAddress.split("\n")[0]}</div></div>
              <div style={{ textAlign: "right" }}><div style={{ fontSize: 24, fontWeight: 700, color: C.green, letterSpacing: -1 }}>INVOICE</div><div style={{ fontSize: 12, color: C.text3 }}>{invForm.invNum || "INV-XXXX"}</div></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20, paddingBottom: 18, borderBottom: `0.5px solid ${C.border}` }}>
              <div><div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 }}>Bill to</div><div style={{ fontSize: 13, fontWeight: 600 }}>{invForm.client || "—"}</div><div style={{ fontSize: 12, color: C.text2 }}>{invForm.email}</div></div>
              <div style={{ textAlign: "right" }}><div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 }}>Due</div><div style={{ fontSize: 13, fontWeight: 700 }}>{fmtDate(invForm.dueDate) || "—"}</div></div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 14 }}>
              <thead><tr>{["Description", "Qty", "Rate", "Amount"].map(h => <th key={h} style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8, color: C.text3, padding: "0 0 8px", borderBottom: `0.5px solid ${C.border}`, textAlign: h === "Amount" ? "right" : "left", fontWeight: 500 }}>{h}</th>)}</tr></thead>
              <tbody>{lineItems.filter(li => li.desc || li.qty).map((li, i) => { const amt = (parseFloat(li.qty) || 0) * (parseFloat(li.rate) || 0); return (<tr key={i}><td style={{ padding: "8px 0", fontSize: 13, borderBottom: `0.5px solid ${C.border}` }}>{li.desc || "—"}</td><td style={{ padding: "8px 0", fontSize: 13, borderBottom: `0.5px solid ${C.border}` }}>{li.qty || "—"}</td><td style={{ padding: "8px 0", fontSize: 13, borderBottom: `0.5px solid ${C.border}` }}>{li.rate ? currSym + parseFloat(li.rate).toFixed(2) : "—"}</td><td style={{ padding: "8px 0", fontSize: 13, textAlign: "right", fontWeight: 500, borderBottom: `0.5px solid ${C.border}` }}>{currSym}{amt.toFixed(2)}</td></tr>); })}</tbody>
            </table>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, paddingTop: 12, borderTop: `0.5px solid ${C.border}` }}>
              <div style={{ display: "flex", gap: 32, fontSize: 13 }}><span style={{ color: C.text2 }}>Subtotal</span><span>{currSym}{sub.toFixed(2)}</span></div>
              {disc > 0 && <div style={{ display: "flex", gap: 32, fontSize: 13 }}><span style={{ color: C.text2 }}>Discount</span><span style={{ color: C.red }}>-{currSym}{disc.toFixed(2)}</span></div>}
              {tax > 0 && <div style={{ display: "flex", gap: 32, fontSize: 13 }}><span style={{ color: C.text2 }}>Tax</span><span>{currSym}{tax.toFixed(2)}</span></div>}
              <div style={{ display: "flex", gap: 32, fontSize: 18, fontWeight: 700, color: C.greenD, paddingTop: 8, borderTop: `0.5px solid ${C.border}`, marginTop: 4 }}><span>Total due</span><span>{currSym}{total.toFixed(2)}</span></div>
            </div>
            {invForm.paymentInstructions && (
              <div style={{ marginTop: 24, paddingTop: 18, borderTop: `0.5px solid ${C.border}`, fontSize: 12, color: C.text2, lineHeight: 1.6 }}>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8, color: C.text3, marginBottom: 4 }}>Payment instructions</div>
                {invForm.paymentInstructions}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Payments
  const renderPayments = () => (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ padding: 24 }}>
        <div style={{ background: C.blueL, border: `0.5px solid #BFDBFE`, borderRadius: 10, padding: "10px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: C.blue }}>
          <span>ℹ️</span> Connect a payment provider so clients can pay invoices online. Funds deposit to your bank in 1–2 business days.
        </div>
        <div style={s.card()}>
          <div style={s.cardHeader}><div style={s.cardTitle}>Payment providers</div></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
            {[
              { key: "stripe", logo: "stripe", label: "Stripe", sub: "Cards, ACH, wire. Most popular.", logoColor: C.stripe, btnLabel: "Connect Stripe", btnBg: C.stripe },
              { key: "square", logo: "■ Square", label: "Square", sub: "Cards, ACH, same-day deposits.", logoColor: "#3E4348", btnLabel: "Connect Square", btnBg: "#3E4348" },
              { key: "ach", logo: "⇄ ACH Direct", label: "ACH / Bank transfer", sub: "Bank-to-bank. 0.8% fee, max $5.", logoColor: C.greenD, btnLabel: "Connect bank", btnBg: C.green },
            ].map(({ key, logo, label, sub, logoColor, btnLabel, btnBg }) => (
              <div key={key} style={{ border: `1.5px solid ${providers[key] ? C.green : C.border2}`, borderRadius: 12, padding: 16, background: providers[key] ? C.greenL : C.card, position: "relative" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: logoColor, marginBottom: 6 }}>{logo}</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 11.5, color: C.text3, marginBottom: 12 }}>{sub}</div>
                <div style={{ position: "absolute", top: 10, right: 10, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: providers[key] ? C.greenL : C.bg2, color: providers[key] ? C.greenD : C.text3 }}>{providers[key] ? "Connected" : "Not connected"}</div>
                <button onClick={() => { setProviders(p => ({ ...p, [key]: !p[key] })); showToast(providers[key] ? `${label} disconnected` : `${label} connected! ✓`); }} style={{ width: "100%", padding: 8, borderRadius: 8, border: providers[key] ? `0.5px solid ${C.border2}` : "none", background: providers[key] ? C.bg2 : btnBg, color: providers[key] ? C.text2 : "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  {providers[key] ? "Disconnect" : btnLabel}
                </button>
              </div>
            ))}
          </div>
          <div style={{ background: C.bg2, borderRadius: 8, padding: "10px 13px", fontSize: 12, color: C.text2, lineHeight: 1.6 }}>
            <strong>Fees:</strong> Stripe cards: 2.9% + 30¢ · Stripe ACH: 0.8% (max $5) · Square: 2.6% + 10¢ · ACH direct: 0.8% (max $5)<br />
            <strong>Tip:</strong> Encourage ACH for large invoices — fees cap at $5 no matter the invoice size.
          </div>
        </div>
        <div style={s.card()}>
          <div style={s.cardHeader}><div style={s.cardTitle}>Auto-payment settings</div></div>
          {[["Auto-reminders for overdue invoices", "Sent at 7 and 14 days past due"], ["Auto-mark invoice paid on payment", "Status updates automatically"], ["Send payment receipt to client", "Email receipt after successful payment"], ["Allow partial payments", "Clients can pay a portion"]].map(([label, sub]) => (
            <div key={label} style={s.toggleRow}>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13 }}>{label}</div><div style={{ fontSize: 12, color: C.text3 }}>{sub}</div></div>
              <div style={{ width: 36, height: 20, borderRadius: 99, background: C.green, position: "relative", cursor: "pointer" }}><div style={{ position: "absolute", width: 14, height: 14, borderRadius: "50%", background: "#fff", top: 3, right: 3, boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} /></div>
            </div>
          ))}
        </div>
        <div style={s.card()}>
          <div style={s.cardHeader}><div style={s.cardTitle}>Payout summary</div></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {[["$14,830", "Collected this month"], ["$421", "Processing fees"], ["$14,409", "Net to bank"]].map(([val, label]) => (
              <div key={label} style={{ background: C.bg2, borderRadius: 10, padding: "14px 16px" }}><div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>{val}</div><div style={{ fontSize: 11, color: C.text3, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Portal
  const renderPortal = () => (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ padding: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, alignItems: "start" }}>
          <div>
            <div style={s.card()}><div style={s.cardHeader}><div style={s.cardTitle}>Portal settings</div></div>
              <div style={s.field(12)}><label style={s.label}>Portal URL slug</label><div style={{ display: "flex", alignItems: "center" }}><span style={{ background: C.bg2, border: `0.5px solid ${C.border2}`, borderRight: "none", borderRadius: "8px 0 0 8px", padding: "8px 10px", fontSize: 12, color: C.text3, flexShrink: 0 }}>pay.pallettbill.com/</span><input style={{ ...s.input, borderRadius: "0 8px 8px 0", flex: 1 }} defaultValue="yourcompany" /></div></div>
              <div style={s.field(12)}><label style={s.label}>Support email</label><input style={s.input} type="email" defaultValue="billing@yourcompany.com" /></div>
              <div style={s.field(0)}><label style={s.label}>Brand color</label><div style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="color" defaultValue="#1D9E75" style={{ width: 44, height: 36, padding: 2, cursor: "pointer", border: `0.5px solid ${C.border2}`, borderRadius: 8 }} /><input style={{ ...s.input, flex: 1 }} defaultValue="#1D9E75" /></div></div>
            </div>
            <div style={s.card(0)}><div style={s.cardHeader}><div style={s.cardTitle}>Notify me when</div></div>
              {["Client opens portal link", "Payment completes", "Client raises a dispute", "Invoice becomes overdue"].map(label => (
                <div key={label} style={s.toggleRow}>
                  <div style={{ flex: 1, fontSize: 13 }}>{label}</div>
                  <div style={{ width: 36, height: 20, borderRadius: 99, background: C.green, position: "relative", cursor: "pointer" }}><div style={{ position: "absolute", width: 14, height: 14, borderRadius: "50%", background: "#fff", top: 3, right: 3 }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize: 11, color: C.text3, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8, fontWeight: 500 }}>Client view preview</p>
            <div style={{ background: "#f5f5f3", borderRadius: 14, overflow: "hidden", border: `0.5px solid ${C.border}` }}>
              <div style={{ background: C.greenD, padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div><div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Your Company 3PL</div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 1 }}>Secure invoice payment</div></div>
                <Icon name="lock" size={16} color="rgba(255,255,255,0.5)" />
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ background: "#fff", borderRadius: 10, border: `0.5px solid ${C.border}`, padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                    <div><div style={{ fontSize: 13.5, fontWeight: 600 }}>Your Company 3PL</div><div style={{ fontSize: 12, color: C.text3, marginTop: 2 }}>Invoice #INV-1001</div></div>
                    <div style={{ textAlign: "right" }}><div style={{ fontSize: 22, fontWeight: 700 }}>$1,242.00</div><div style={{ fontSize: 12, color: C.text3 }}>Due Jul 15, 2025</div></div>
                  </div>
                  <div style={{ borderTop: `0.5px solid ${C.border}`, paddingTop: 12, marginBottom: 14 }}>
                    {[["Pallet storage", "$756.00"], ["Inbound handling", "$139.50"], ["Outbound handling", "$261.50"], ["Hazmat fee", "$85.00"]].map(([desc, amt]) => (
                      <div key={desc} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}><span style={{ color: C.text2 }}>{desc}</span><span style={{ fontWeight: 500 }}>{amt}</span></div>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                    {[["💳 Card", "Instant · 2.9%", true], ["🏦 ACH", "1–3 days · 0.8%", false]].map(([label, sub, sel]) => (
                      <div key={label} style={{ border: `1.5px solid ${sel ? C.green : C.border2}`, borderRadius: 9, padding: 12, background: sel ? C.greenL : C.card }}><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 1 }}>{label}</div><div style={{ fontSize: 11, color: C.text3 }}>{sub}</div></div>
                    ))}
                  </div>
                  <button onClick={() => showToast("Payment of $1,242.00 processed! ✓")} style={{ width: "100%", background: C.green, color: "#fff", border: "none", padding: 13, borderRadius: 9, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Pay $1,242.00 now</button>
                  <div style={{ textAlign: "center", marginTop: 8, fontSize: 11, color: C.text3 }}>🔒 Secured by Stripe · 256-bit encryption</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Rates
  const renderRates = () => {
    const rateGroups = [
      { title: "Storage", rows: [["Pallet storage / month", "pallet", "/ pallet"], ["Bin storage / month", "bin", "/ bin"], ["Floor / overflow", "floor", "/ sq ft"], ["Monthly minimum", "min", ""]] },
      { title: "Handling", rows: [["Inbound — per unit", "inUnit", "/ unit"], ["Outbound — per unit", "outUnit", "/ unit"], ["Inbound — per pallet", "inPallet", "/ pallet"], ["Outbound — per pallet", "outPallet", "/ pallet"]] },
      { title: "Accessorials", rows: [["Hazmat / special handling", "hazmat", ""], ["Repackaging / relabeling", "repack", "/ hr"], ["Refused shipment fee", "refused", ""], ["After-hours access", "afterhours", "/ hr"], ["Returns processing", "returns", "/ unit"], ["Kitting / assembly", "kitting", "/ unit"]] },
    ];
    return (
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ padding: 24 }}>
          {rateGroups.map(({ title, rows }) => (
            <div key={title} style={s.card()}>
              <div style={s.cardHeader}><div style={s.cardTitle}>{title}</div></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {rows.map(([label, key, suffix]) => (
                  <div key={key}>
                    <label style={s.label}>{label}</label>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span style={{ background: C.bg2, border: `0.5px solid ${C.border2}`, borderRight: "none", borderRadius: "8px 0 0 8px", padding: "8px 10px", fontSize: 13, color: C.text3 }}>$</span>
                      <input type="number" value={rateCard[key]} onChange={e => setRateCard(r => ({ ...r, [key]: parseFloat(e.target.value) || 0 }))} style={{ ...s.input, borderRadius: suffix ? "0" : "0 8px 8px 0", flex: 1 }} step="0.01" />
                      {suffix && <span style={{ background: C.bg2, border: `0.5px solid ${C.border2}`, borderLeft: "none", borderRadius: "0 8px 8px 0", padding: "8px 10px", fontSize: 12, color: C.text3, whiteSpace: "nowrap" }}>{suffix}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <Btn variant="primary" onClick={async () => {
            await supabase.from("rate_cards").upsert({
              user_id: userId, pallet_storage: rateCard.pallet, bin_storage: rateCard.bin,
              floor_storage: rateCard.floor, monthly_min: rateCard.min, inbound_unit: rateCard.inUnit,
              outbound_unit: rateCard.outUnit, inbound_pallet: rateCard.inPallet, outbound_pallet: rateCard.outPallet,
              hazmat: rateCard.hazmat, repackaging: rateCard.repack, refused: rateCard.refused,
              after_hours: rateCard.afterhours, returns: rateCard.returns, kitting: rateCard.kitting,
            }, { onConflict: "user_id" });
            showToast("Rate card saved");
          }}>Save rate card</Btn>
        </div>
      </div>
    );
  };

  // Settings
  const renderSettings = () => (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ padding: 24 }}>
        <div style={s.card()}><div style={s.cardHeader}><div style={s.cardTitle}>Your company</div></div>
          <div style={s.formGrid}>
            <div style={{ ...s.field(), gridColumn: "1/-1" }}><label style={s.label}>Company name</label><input style={s.input} value={companyName} onChange={e => setCompanyName(e.target.value)} /></div>
            <div style={{ ...s.field(), gridColumn: "1/-1" }}><label style={s.label}>Address</label><textarea style={s.textarea} value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} rows={2} /></div>
            <div style={s.field()}><label style={s.label}>Phone</label><input style={s.input} defaultValue="(254) 555-0100" /></div>
            <div style={s.field()}><label style={s.label}>Billing email</label><input style={s.input} type="email" defaultValue="billing@yourcompany.com" /></div>
          </div>
        </div>
        <div style={s.card()}><div style={s.cardHeader}><div style={s.cardTitle}>Invoice defaults</div></div>
          <div style={s.formGrid}>
            <div style={s.field()}><label style={s.label}>Default terms</label><select style={s.select}><option>Net 15</option><option>Net 30</option><option>Net 60</option></select></div>
            <div style={s.field()}><label style={s.label}>Invoice prefix</label><input style={s.input} defaultValue="INV-" /></div>
            <div style={s.field()}><label style={s.label}>Next invoice number</label><input style={s.input} type="number" defaultValue={Math.max(...invoices.map(i => parseInt(i.id.split("-")[1]) || 0)) + 1} /></div>
            <div style={s.field()}><label style={s.label}>Default tax rate (%)</label><input style={s.input} type="number" defaultValue="0" step="0.1" /></div>
          </div>
        </div>
        <Btn variant="primary" onClick={async () => {
          await supabase.from("profiles").update({ company_name: companyName, address: companyAddress }).eq("id", userId);
          showToast("Settings saved");
        }}>Save changes</Btn>
      </div>
    </div>
  );

  // ── VIEW ROUTER ──
  const renderView = () => {
    if (view === "dashboard") return renderDashboard();
    if (view === "invoices") return renderInvoices();
    if (view === "newInvoice") return renderNewInvoice();
    if (view === "contacts") return renderContacts();
    if (view === "pipeline") return renderPipeline();
    if (view === "activity") return renderActivity();
    if (view === "payments") return renderPayments();
    if (view === "portal") return renderPortal();
    if (view === "rates") return renderRates();
    if (view === "settings") return renderSettings();
    return null;
  };

  const VIEW_TITLES = { dashboard: "Dashboard", invoices: "All invoices", newInvoice: "New invoice", contacts: selectedContact ? selectedContact.name : "Contacts", pipeline: "Pipeline", activity: "Activity feed", payments: "Payment connections", portal: "Client portal", rates: "Rate card", settings: "Settings" };

  return (
    <div style={s.app}>
      {/* SIDEBAR */}
      <aside style={s.sidebar}>
        <div style={s.logo}>
          <div style={s.logoMark}>pallet<span style={s.logoSpan}>bill</span></div>
          <div style={s.logoSub}>Invoice + CRM</div>
        </div>
        <nav style={s.nav}>
          {navGroups.map(({ section, items }) => (
            <div key={section}>
              <div style={s.navSection}>{section}</div>
              {items.map(({ id, label, icon, badge, badgeColor }) => (
                <div key={id} style={s.navItem(view === id)} onClick={() => { if (id === "newInvoice") { setInvForm(f => ({ ...f, invNum: nextInvNum(invoices), invDate: today(), periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0], periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split("T")[0], dueDate: (() => { const d = new Date(); d.setDate(d.getDate() + 15); return d.toISOString().split("T")[0]; })() })); setLineItems([{ desc: "Pallet storage", qty: "", rate: "" }, { desc: "Inbound handling", qty: "", rate: "" }]); } go(id); }}>
                  <Icon name={icon} size={15} />
                  {label}
                  {badge ? <span style={s.navBadge(badgeColor || C.green)}>{badge}</span> : null}
                </div>
              ))}
            </div>
          ))}
        </nav>
        <div style={s.sideFooter}>
          <div style={{ fontSize: 12, color: C.text2, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.user.email}</div>
          <button onClick={() => supabase.auth.signOut()} style={{ width: "100%", background: C.bg2, color: C.text2, border: `0.5px solid ${C.border2}`, padding: "6px 10px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Sign out</button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", overflow: "hidden" }}>
        <div style={s.topbar}>
          <div>
            <div style={s.topTitle}>{VIEW_TITLES[view] || view}</div>
            {view === "dashboard" && <div style={s.topSub}>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</div>}
          </div>
          <div style={s.topActions}>
            {view === "contacts" && !selectedContact && <Btn variant="primary" sm onClick={() => setModal("addContact")}><Icon name="plus" size={12} />Add contact</Btn>}
            {view === "invoices" && <Btn variant="primary" sm onClick={() => go("newInvoice")}><Icon name="plus" size={12} />New invoice</Btn>}
            {view === "dashboard" && <Btn variant="primary" sm onClick={() => go("newInvoice")}><Icon name="plus" size={12} />New invoice</Btn>}
          </div>
        </div>
        {renderView()}
      </div>

      {/* MODALS */}
      <Modal open={modal === "addContact"} onClose={() => setModal(null)} title="Add contact">
        <div style={s.formGrid}>
          <div style={s.field()}><label style={s.label}>Full name *</label><input style={s.input} value={contactForm.name} onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))} placeholder="Jeff Kogut" /></div>
          <div style={s.field()}><label style={s.label}>Title</label><input style={s.input} value={contactForm.title} onChange={e => setContactForm(f => ({ ...f, title: e.target.value }))} placeholder="Director of Operations" /></div>
          <div style={s.field()}><label style={s.label}>Company</label><input style={s.input} value={contactForm.company} onChange={e => setContactForm(f => ({ ...f, company: e.target.value }))} placeholder="Crossroads 3PL" /></div>
          <div style={s.field()}><label style={s.label}>Email *</label><input style={s.input} type="email" value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} placeholder="jeff@company.com" /></div>
          <div style={s.field()}><label style={s.label}>Phone</label><input style={s.input} value={contactForm.phone} onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))} placeholder="(254) 555-0100" /></div>
          <div style={s.field()}><label style={s.label}>City</label><input style={s.input} value={contactForm.city} onChange={e => setContactForm(f => ({ ...f, city: e.target.value }))} placeholder="Temple, TX" /></div>
          <div style={s.field()}><label style={s.label}>Stage</label><select style={s.select} value={contactForm.stage} onChange={e => setContactForm(f => ({ ...f, stage: e.target.value }))}>{PIPELINE_STAGES.map(st => <option key={st}>{st}</option>)}</select></div>
          <div style={s.field()}><label style={s.label}>Annual value ($)</label><input style={s.input} type="number" value={contactForm.value} onChange={e => setContactForm(f => ({ ...f, value: e.target.value }))} placeholder="1200" /></div>
          <div style={s.field()}><label style={s.label}>Source</label><select style={s.select} value={contactForm.source} onChange={e => setContactForm(f => ({ ...f, source: e.target.value }))}><option value="">Select...</option>{["Cold email", "LinkedIn", "Google Maps", "Facebook group", "Referral", "Inbound", "Direct"].map(s => <option key={s}>{s}</option>)}</select></div>
          <div style={s.field()}><label style={s.label}>Tags (comma-separated)</label><input style={s.input} value={contactForm.tags} onChange={e => setContactForm(f => ({ ...f, tags: e.target.value }))} placeholder="Temple, FBA, Austin" /></div>
          <div style={{ ...s.field(), gridColumn: "1/-1" }}><label style={s.label}>Notes</label><textarea style={s.textarea} value={contactForm.notes} onChange={e => setContactForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Context, pain points, next steps..." /></div>
          <div style={{ ...s.field(0), gridColumn: "1/-1" }}><label style={s.label}>Follow-up date</label><input style={s.input} type="date" value={contactForm.nextFollowUp || ""} onChange={e => setContactForm(f => ({ ...f, nextFollowUp: e.target.value }))} /></div>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
          <Btn onClick={() => setModal(null)}>Cancel</Btn>
          <Btn variant="primary" onClick={saveContact}>Save contact</Btn>
        </div>
      </Modal>

      <Modal open={modal === "addActivity"} onClose={() => setModal(null)} title={`Log activity — ${selectedContact?.name}`} width={420}>
        <div style={s.field(12)}>
          <label style={s.label}>Type</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Object.entries(ACTIVITY_ICONS).map(([type, icon]) => (
              <button key={type} onClick={() => setActivityForm(f => ({ ...f, type }))} style={{ padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${activityForm.type === type ? C.green : C.border2}`, background: activityForm.type === type ? C.greenL : C.card, color: activityForm.type === type ? C.greenD : C.text2, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                {icon} {type.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
        <div style={s.field(12)}><label style={s.label}>Date</label><input style={s.input} type="date" value={activityForm.date} onChange={e => setActivityForm(f => ({ ...f, date: e.target.value }))} /></div>
        <div style={s.field(0)}><label style={s.label}>Details *</label><textarea style={s.textarea} value={activityForm.text} onChange={e => setActivityForm(f => ({ ...f, text: e.target.value }))} placeholder="What happened? What was discussed? Next steps?" rows={3} /></div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
          <Btn onClick={() => setModal(null)}>Cancel</Btn>
          <Btn variant="primary" onClick={() => addActivity(selectedContact?.id)}>Log activity</Btn>
        </div>
      </Modal>

      <Toast msg={toast.msg} type={toast.type} visible={toast.visible} />
    </div>
  );
}

// ── RATE ITEMS for quick-add ──
const RATE_ITEMS = [
  { label: "Pallet storage", rateKey: "pallet", desc: "Pallet storage" },
  { label: "Bin storage", rateKey: "bin", desc: "Bin storage" },
  { label: "Floor storage", rateKey: "floor", desc: "Floor / overflow storage" },
  { label: "Monthly minimum", rateKey: "min", desc: "Monthly minimum" },
  { label: "Inbound (unit)", rateKey: "inUnit", desc: "Inbound handling" },
  { label: "Outbound (unit)", rateKey: "outUnit", desc: "Outbound handling" },
  { label: "Inbound (pallet)", rateKey: "inPallet", desc: "Inbound pallet handling" },
  { label: "Outbound (pallet)", rateKey: "outPallet", desc: "Outbound pallet handling" },
  { label: "Hazmat fee", rateKey: "hazmat", desc: "Hazmat / special handling" },
  { label: "Repackaging", rateKey: "repack", desc: "Repackaging / relabeling" },
  { label: "Refused shipment", rateKey: "refused", desc: "Refused shipment fee" },
  { label: "After-hours", rateKey: "afterhours", desc: "After-hours access" },
  { label: "Returns processing", rateKey: "returns", desc: "Returns processing" },
  { label: "Kitting / assembly", rateKey: "kitting", desc: "Kitting / assembly" },
];
