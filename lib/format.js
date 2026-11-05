export const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
export const slugify = (s) => String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
export const dateFmt = (d) => d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }) : "";
export const dayFmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "";

export const STATUS = {
  pending_payment: "Awaiting payment", paid: "Paid", processing: "Processing", shipped: "Shipped",
  delivered: "Delivered", cancelled: "Cancelled", refunded: "Refunded",
};
export const STEPS = ["paid", "processing", "shipped", "delivered"];

export const STATES = ["Andaman and Nicobar Islands","Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chandigarh","Chhattisgarh","Dadra and Nagar Haveli and Daman and Diu","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jammu and Kashmir","Jharkhand","Karnataka","Kerala","Ladakh","Lakshadweep","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Puducherry","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal"];

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.taeken.in").replace(/\/$/, "");

// Map the state names returned by the pin-code service onto our dropdown values.
export function matchState(name) {
  const n = String(name || "").toLowerCase().replace(/&/g, "and").replace(/\s+/g, " ").trim();
  const alias = { orissa: "odisha", pondicherry: "puducherry", uttaranchal: "uttarakhand", "dadra and nagar haveli": "dadra and nagar haveli and daman and diu", "daman and diu": "dadra and nagar haveli and daman and diu", "andaman and nicobar": "andaman and nicobar islands", "jammu and kashmir": "jammu and kashmir", "nct of delhi": "delhi" };
  const want = alias[n] || n;
  return STATES.find((x) => x.toLowerCase() === want) || "";
}

// Every pair is sold in UK 6 to UK 12
export const UK_SIZES = ["6", "7", "8", "9", "10", "11", "12"];
export const mergeSizes = (txt) => [...new Set([...UK_SIZES, ...String(txt || "").split(",").map((s) => s.trim()).filter(Boolean)])].sort((a, b) => a - b);

// A different Japanese word behind each product (stable per product).
const KANJI = ["闘", "街", "走", "速", "魂"];
const kIdx = (slug = "") => [...String(slug)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % KANJI.length;
export const kanjiFor = (slug = "") => KANJI[kIdx(slug)];
export const kanjiPair = (slug = "") => [KANJI[kIdx(slug)], KANJI[(kIdx(slug) + 2) % KANJI.length]];   // two different words per product

// Estimated delivery window: adds business days (Mon-Sat) to today. Returns "Tue, 11 Nov – Fri, 14 Nov".
export function etaRange(min, max) {
  const add = (n) => { const d = new Date(); let k = 0; while (k < n) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0) k++; } return d; };
  const f = (d) => d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  return `${f(add(min))} – ${f(add(max))}`;
}
