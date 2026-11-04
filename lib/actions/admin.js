"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "../admin";
import { serviceClient } from "../supabase/server";
import { TABLES, SETTING_KEYS, PAGE_SLUGS } from "../adminSchema";
import { parseCSV } from "../csv";
import { slugify } from "../format";
import { sendEmail, shippedEmail } from "../email";

const db = () => serviceClient();
const refresh = () => revalidatePath("/", "layout");

/** Generic create/update for collections, tags, colors, slides, blocks. */
export async function saveRow(table, id, values) {
  await requireAdmin();
  const t = TABLES[table]; if (!t) return { error: "Unknown table" };
  const row = {};
  for (const c of t.cols) if (c in values) row[c] = values[c];
  if (t.slugFrom) row.slug = slugify(values.slug || values[t.slugFrom]);
  if (t.slugFrom && !row.slug) return { error: "Name is required" };
  const { error } = id ? await db().from(table).update(row).eq("id", id) : await db().from(table).insert(row);
  if (error) return { error: error.message };
  refresh(); return { ok: true };
}
export async function deleteRow(table, id) {
  await requireAdmin();
  if (!TABLES[table]) return { error: "Unknown table" };
  const { error } = await db().from(table).delete().eq("id", id);
  if (error) return { error: error.message };
  refresh(); return { ok: true };
}
/** Move a row up/down by rewriting sort_order for the whole list. */
export async function moveRow(table, id, dir) {
  await requireAdmin();
  if (!TABLES[table]) return { error: "Unknown table" };
  const { data } = await db().from(table).select("id").order("sort_order").order("id");
  const ids = data.map((r) => r.id); const i = ids.indexOf(id), j = i + (dir === "up" ? -1 : 1);
  if (i < 0 || j < 0 || j >= ids.length) return { ok: true };
  [ids[i], ids[j]] = [ids[j], ids[i]];
  for (let k = 0; k < ids.length; k++) await db().from(table).update({ sort_order: (k + 1) * 10 }).eq("id", ids[k]);
  refresh(); return { ok: true };
}

export async function saveProduct(id, v) {
  await requireAdmin();
  const num = (x) => (x === "" || x == null ? null : Math.round(Number(x)));
  const row = {
    name: String(v.name || "").trim(), slug: slugify(v.slug || v.name),
    price: num(v.price), compare_price: num(v.compare_price),
    description: v.description || "", details: v.details || "",
    images: (v.images || []).filter(Boolean), colors: v.colors || [], tags: v.tags || [],
    sizes: Object.fromEntries(Object.entries(v.sizes || {}).map(([k, n]) => [k, Math.max(0, Number(n) || 0)])),
    collection_id: v.collection_id || null, active: !!v.active, sort_order: Number(v.sort_order) || 0,
  };
  if (!row.name || !row.slug || row.price == null) return { error: "Name and price are required" };
  const { data, error } = id ? await db().from("products").update(row).eq("id", id).select("id").single() : await db().from("products").insert(row).select("id").single();
  if (error) return { error: error.code === "23505" ? "That URL slug is already used by another product" : error.message };
  refresh(); return { ok: true, id: data.id };
}
export async function deleteProduct(id) {
  await requireAdmin();
  const { error } = await db().from("products").delete().eq("id", id);
  if (error) return { error: error.message };
  refresh(); return { ok: true };
}

export async function saveSettings(v) {
  await requireAdmin();
  const { data } = await db().from("site_settings").select("value").eq("key", "site").maybeSingle();
  const next = { ...(data?.value || {}) };
  for (const k of SETTING_KEYS) if (k in v) next[k] = v[k];
  for (const k of ["free_shipping_min", "shipping_fee", "return_days", "exchange_days", "refund_days"]) next[k] = Number(next[k]) || 0;
  if (typeof next.ticker === "string") next.ticker = next.ticker.split("\n").map((s) => s.trim()).filter(Boolean);
  next.instagram = String(next.instagram || "").replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "");
  const { error } = await db().from("site_settings").upsert({ key: "site", value: next, updated_at: new Date().toISOString() });
  if (error) return { error: error.message };
  refresh(); return { ok: true };
}

export async function updateOrder(id, v) {
  await requireAdmin();
  const { data: before } = await db().from("orders").select("*").eq("id", id).single();
  const patch = { status: v.status, courier: v.courier || null, tracking_number: v.tracking_number || null, tracking_url: v.tracking_url || null, notes: v.notes || null };
  if (v.status === "shipped" && !before.shipped_at) patch.shipped_at = new Date().toISOString();
  if (v.status === "delivered" && !before.delivered_at) patch.delivered_at = new Date().toISOString();
  const { data, error } = await db().from("orders").update(patch).eq("id", id).select().single();
  if (error) return { error: error.message };
  if (v.status === "shipped" && (before.status !== "shipped" || before.tracking_number !== data.tracking_number)) await sendEmail({ to: data.email, ...shippedEmail(data) });
  revalidatePath("/admin/orders"); revalidatePath(`/admin/orders/${id}`); return { ok: true };
}

/** CSV columns: order_number, courier, tracking_number, tracking_url (optional). Marks orders shipped + emails customers. */
export async function importTracking(csvText) {
  await requireAdmin();
  const rows = parseCSV(csvText);
  const out = { updated: 0, skipped: [] };
  for (const r of rows) {
    const num = (r.order_number || "").trim();
    if (!num || !r.tracking_number) { if (num) out.skipped.push(`${num}: missing tracking_number`); continue; }
    const { data: o } = await db().from("orders").select("*").eq("order_number", num).maybeSingle();
    if (!o) { out.skipped.push(`${num}: order not found`); continue; }
    if (!["paid", "processing", "shipped"].includes(o.status)) { out.skipped.push(`${num}: status is ${o.status}`); continue; }
    const patch = { courier: r.courier || null, tracking_number: r.tracking_number, tracking_url: r.tracking_url || null, status: "shipped", shipped_at: o.shipped_at || new Date().toISOString() };
    const { data, error } = await db().from("orders").update(patch).eq("id", o.id).select().single();
    if (error) { out.skipped.push(`${num}: ${error.message}`); continue; }
    await sendEmail({ to: data.email, ...shippedEmail(data) });
    out.updated++;
  }
  revalidatePath("/admin/orders"); return out;
}

export async function setMessageStatus(id, status) {
  await requireAdmin();
  const { error } = await db().from("messages").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/messages"); return { ok: true };
}

export async function savePage(slug, title, body) {
  await requireAdmin();
  if (!PAGE_SLUGS.includes(slug)) return { error: "Unknown page" };
  const { error } = await db().from("pages").upsert({ slug, title, body, updated_at: new Date().toISOString() });
  if (error) return { error: error.message };
  revalidatePath(`/policies/${slug}`); return { ok: true };
}
export async function resetPage(slug) {
  await requireAdmin();
  await db().from("pages").delete().eq("slug", slug);
  revalidatePath(`/policies/${slug}`); revalidatePath("/admin/pages"); return { ok: true };
}
