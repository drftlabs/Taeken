import crypto from "crypto";

const secret = () => process.env.OTP_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "taeken-dev-secret";

/** Indian mobile -> "91XXXXXXXXXX", or null if it doesn't look like one. */
export function normalizePhone(p) {
  let d = String(p || "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? "91" + d : null;
}
export const newCode = () => String(crypto.randomInt(0, 10000)).padStart(4, "0");
export const hashCode = (phone, code) => crypto.createHmac("sha256", secret()).update(phone + ":" + code).digest("hex");
export const safeEq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };

/** Signed proof that this phone passed the WhatsApp check (valid 20 minutes). */
export function signToken(phone) {
  const body = Buffer.from(JSON.stringify({ p: phone, e: Date.now() + 20 * 60 * 1000 })).toString("base64url");
  return body + "." + crypto.createHmac("sha256", secret()).update(body).digest("base64url");
}
export function checkToken(token, phone) {
  const [body, sig] = String(token || "").split("."); if (!body || !sig) return false;
  const want = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  if (!safeEq(sig, want)) return false;
  try { const j = JSON.parse(Buffer.from(body, "base64url").toString()); return j.p === phone && j.e > Date.now(); } catch { return false; }
}

/** Sends the OTP with an approved WhatsApp "Authentication" template (Meta WhatsApp Cloud API). */
export async function sendWhatsAppCode(phone, code) {
  const token = process.env.WHATSAPP_TOKEN, id = process.env.WHATSAPP_PHONE_ID;
  if (!token || !id) return { ok: false, notConfigured: true };
  const name = process.env.WHATSAPP_TEMPLATE || "taeken_cod_otp", lang = process.env.WHATSAPP_TEMPLATE_LANG || "en";
  const r = await fetch(`https://graph.facebook.com/v20.0/${id}/messages`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: phone, type: "template", template: { name, language: { code: lang }, components: [
      { type: "body", parameters: [{ type: "text", text: code }] },
      { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: code }] },
    ] } }),
  });
  if (!r.ok) { const t = await r.text().catch(() => ""); console.error("[whatsapp otp]", r.status, t.slice(0, 300)); return { ok: false, status: r.status }; }
  return { ok: true };
}
