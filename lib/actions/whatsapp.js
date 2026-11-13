"use server";
import { guard } from "../admin";
import { serviceClient } from "../supabase/server";
import { normalizePhone, sendWhatsAppCode, whatsappAdvice } from "../otp";

const G = "https://graph.facebook.com/v20.0";
async function graph(path, token) {
  try {
    const r = await fetch(`${G}/${path}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    return r.ok ? { ok: true, data: j } : { ok: false, error: j.error || { message: `HTTP ${r.status}` } };
  } catch (e) { return { ok: false, error: { message: e.message, network: true } }; }
}

/** Owner-only: checks the WhatsApp settings step by step and (optionally) sends a real test message. */
export async function testWhatsApp(phone) {
  { const g = await guard("owner"); if (g) return g; }
  const token = (process.env.WHATSAPP_TOKEN || "").trim(), id = (process.env.WHATSAPP_PHONE_ID || "").trim();
  const out = {
    env: { token: token ? `set (${token.length} characters)` : "MISSING", phoneId: id || "MISSING", template: process.env.WHATSAPP_TEMPLATE || "taeken_cod_otp (default)", lang: process.env.WHATSAPP_TEMPLATE_LANG || "en (default)", testMode: process.env.OTP_TEST_MODE === "1" ? "ON (no WhatsApp is sent, remove it for live)" : "off" },
  };
  if (!token || !id) { out.advice = "Add WHATSAPP_TOKEN and WHATSAPP_PHONE_ID in Vercel → Settings → Environment Variables, then redeploy."; return out; }
  if (!/^\d{10,20}$/.test(id)) out.warn = "WHATSAPP_PHONE_ID should be digits only (e.g. 1466835799846871). Remove spaces or quotes.";
  const info = await graph(`${id}?fields=display_phone_number,verified_name,quality_rating,code_verification_status`, token);
  if (!info.ok) { out.phone = { ok: false, error: info.error }; out.advice = whatsappAdvice(info.error); return out; }
  out.phone = { ok: true, ...info.data };
  const mode = await graph(`${id}?fields=account_mode`, token);
  if (mode.ok && mode.data.account_mode) out.phone.account_mode = mode.data.account_mode;
  const nm = await graph(`${id}?fields=name_status,new_name_status`, token);
  if (nm.ok) { out.phone.name_status = nm.data.name_status; out.phone.new_name_status = nm.data.new_name_status; if (nm.data.name_status && nm.data.name_status !== "APPROVED") out.nameWarn = `Display name status is ${nm.data.name_status}. Meta will not let this number send messages until the display name is APPROVED (WhatsApp Manager → Phone numbers → your number → Profile → display name).`; }
  if (out.phone.account_mode === "SANDBOX" || /^\+?1 ?555/.test(String(info.data.display_phone_number || ""))) out.testNumber = "This looks like Meta's TEST number. It can only send to up to 5 numbers you add under API Setup → To → Manage phone number list, and cannot serve real customers. Add and verify your own business number in WhatsApp Manager → Phone numbers → Add phone number, then use ITS Phone number ID.";
  const to = normalizePhone(phone);
  if (!phone) { out.advice = "Settings look reachable. Enter a mobile number below and press Send test code to test the template."; return out; }
  if (!to) { out.advice = "Enter a valid 10-digit Indian mobile number."; return out; }
  const s = await sendWhatsAppCode(to, "1234");
  out.send = s.ok ? { ok: true, messageId: s.id } : { ok: false, code: s.code, sub: s.sub, message: s.message, detail: s.detail, status: s.status };
  out.advice = s.ok ? "Sent. The message should arrive on WhatsApp within seconds (code 1234 is just a test). If it never arrives, the number may not have WhatsApp, or it is a test number and this recipient isn't on the allowed list." : whatsappAdvice(s);
  return out;
}

/** Owner-only: the latest delivery reports Meta sent us (via the webhook), with advice for failures. */
export async function whatsappLog() {
  { const g = await guard("owner"); if (g) return g; }
  const sb = serviceClient();
  const { data, error } = await sb.from("whatsapp_events").select("*").order("created_at", { ascending: false }).limit(15);
  if (error) return { missing: true };
  return { rows: (data || []).map((r) => ({ ...r, advice: r.status === "failed" ? whatsappAdvice({ code: r.code, message: `${r.title || ""} ${r.detail || ""}` }) : "" })) };
}

/** Owner-only: tells Meta to send this app's webhook events for your WhatsApp Business Account. */
export async function subscribeApp(wabaId) {
  { const g = await guard("owner"); if (g) return g; }
  const token = (process.env.WHATSAPP_TOKEN || "").trim(), id = String(wabaId || "").replace(/\D/g, "");
  if (!token) return { error: "WHATSAPP_TOKEN is not set." };
  if (id.length < 8) return { error: "Enter the WhatsApp Business Account ID (digits)." };
  try {
    const r = await fetch(`${G}/${id}/subscribed_apps`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    const j = await r.json().catch(() => ({}));
    return r.ok && j.success ? { ok: true } : { error: `(#${j.error?.code ?? r.status}) ${j.error?.message || "Meta refused"}`, advice: whatsappAdvice(j.error || {}) };
  } catch (e) { return { error: e.message }; }
}
