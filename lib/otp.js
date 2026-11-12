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

/** Plain-English advice for the error codes Meta's WhatsApp Cloud API returns. */
export function whatsappAdvice(e = {}) {
  const c = Number(e.code), m = String(e.message || "");
  if (e.network) return "Could not reach Meta (network problem). Try again.";
  if (c === 190 || c === 102) return "The access token is wrong or expired. Create a permanent token from a System user (see WHATSAPP_SETUP.md step 3) and update WHATSAPP_TOKEN in Vercel, then redeploy.";
  if ([100, 10, 200, 299, 3].includes(c) || /does not exist|missing permissions|Unsupported (get|post) request/i.test(m)) return "Either WHATSAPP_PHONE_ID is wrong (it must be the 'Phone number ID' from WhatsApp Manager → Phone numbers, NOT the WhatsApp Business Account ID), or the token's System user has no access to this WhatsApp account. Fix: Business settings → Accounts → WhatsApp accounts → your account → Assign people → pick the System user → turn on 'Manage WhatsApp Business Account' (full control).";
  if (c === 131030) return "Recipient not in the allowed list. This is a TEST number: it can only message numbers you add under developers.facebook.com → your app → WhatsApp → API Setup → To → Manage phone number list. For real customers you need your own registered business number.";
  if (c === 132001) return "Template not found for this name + language. Check WHATSAPP_TEMPLATE (taeken_cod_otp) and WHATSAPP_TEMPLATE_LANG. If the template says 'English (US)' use en_US; if 'English' use en.";
  if ([132000, 132005, 132007, 132012, 132015, 132016].includes(c)) return "The template was found but its parameters don't match (or it is paused/disabled). Open the template in WhatsApp Manager and check its status is Active and it is an Authentication template with a 'Copy code' button.";
  if (c === 131042) return "Meta needs a payment method on the WhatsApp account. WhatsApp Manager → Account tools → Payment settings → add a card.";
  if (c === 131047 || c === 131026) return "That number can't receive the message (not on WhatsApp, or hasn't messaged recently where required).";
  if (c === 133010 || c === 133004 || c === 133005) return "The business phone number isn't registered/active for the Cloud API yet. In WhatsApp Manager → Phone numbers, finish adding and verifying the number.";
  if (c === 130429 || c === 131056 || c === 80007) return "Meta is rate-limiting this number. Wait a minute and try again.";
  return "Meta rejected the message. See the technical detail above.";
}

/** Sends the OTP with an approved WhatsApp "Authentication" template (Meta WhatsApp Cloud API). */
export async function sendWhatsAppCode(phone, code) {
  const token = process.env.WHATSAPP_TOKEN, id = process.env.WHATSAPP_PHONE_ID;
  if (!token || !id) return { ok: false, notConfigured: true };
  const name = process.env.WHATSAPP_TEMPLATE || "taeken_cod_otp", lang = process.env.WHATSAPP_TEMPLATE_LANG || "en";
  try {
    const r = await fetch(`https://graph.facebook.com/v20.0/${id.trim()}/messages`, {
      method: "POST", headers: { Authorization: `Bearer ${token.trim()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: phone, type: "template", template: { name: name.trim(), language: { code: lang.trim() }, components: [
        { type: "body", parameters: [{ type: "text", text: code }] },
        { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: code }] },
      ] } }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      const e = j.error || {}; console.error("[whatsapp otp]", r.status, JSON.stringify(e).slice(0, 400));
      return { ok: false, status: r.status, code: e.code, sub: e.error_subcode, message: e.message, detail: e.error_data?.details };
    }
    return { ok: true, id: j.messages?.[0]?.id };
  } catch (e) { console.error("[whatsapp otp] network", e.message); return { ok: false, network: true, message: e.message }; }
}
