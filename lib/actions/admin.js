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
  if (table === "discounts") {
    row.code = String(values.code || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    if (!row.code) return { error: "Enter a code (letters and numbers)" };
    for (const k of ["max_uses", "expires_at"]) if (row[k] === "" || row[k] == null) row[k] = null;
    for (const k of ["value", "min_order"]) row[k] = Number(row[k]) || 0;
    if (row.max_uses != null) row.max_uses = Number(row.max_uses);
  }
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

const num = (x) => (x === "" || x == null ? null : Math.round(Number(x)));
function productRow(v) {
  const ids = [...new Set((v.collection_ids || []).filter(Boolean))];
  return {
    name: String(v.name || "").trim(), slug: slugify(v.slug || v.name),
    price: num(v.price), compare_price: num(v.compare_price), cost_price: num(v.cost_price), weight_g: num(v.weight_g),
    sku: v.sku ? String(v.sku).trim() : null, barcode: v.barcode ? String(v.barcode).trim() : null,
    vendor: v.vendor || "Taeken", product_type: v.product_type || "",
    seo_title: v.seo_title || "", seo_description: v.seo_description || "",
    description: v.description || "", long_description: v.long_description || "", details: v.details || "",
    images: (v.images || []).filter(Boolean), colors: v.colors || [], tags: v.tags || [],
    sizes: Object.fromEntries(Object.entries(v.sizes || {}).map(([k, n]) => [k, Math.max(0, Number(n) || 0)])),
    collection_ids: ids, collection_id: ids[0] || null,
    active: !!v.active, featured: !!v.featured, low_stock: Math.max(0, Number(v.low_stock) || 0), sort_order: Number(v.sort_order) || 0,
  };
}
export async function saveProduct(id, v) {
  await requireAdmin();
  const row = productRow(v);
  if (!row.name || !row.slug || row.price == null) return { error: "Name and price are required" };
  const { data, error } = id ? await db().from("products").update(row).eq("id", id).select("id").single() : await db().from("products").insert(row).select("id").single();
  if (error) return { error: error.code === "23505" ? "That URL slug or SKU is already used by another product" : error.code === "42703" ? "Database needs the latest migration (run supabase/migration_2.sql in Supabase)." : error.message };
  refresh(); return { ok: true, id: data.id };
}
export async function duplicateProduct(id) {
  await requireAdmin();
  const { data: p } = await db().from("products").select("*").eq("id", id).single();
  if (!p) return { error: "Not found" };
  const { id: _i, created_at, ...rest } = p;
  const slug = slugify(p.slug + "-copy-" + Math.random().toString(36).slice(2, 5));
  const { data, error } = await db().from("products").insert({ ...rest, name: p.name + " (copy)", slug, sku: null, active: false }).select("id").single();
  if (error) return { error: error.message };
  refresh(); return { ok: true, id: data.id };
}
/** Bulk actions from the products list. action: live | hide | delete | add_collection | remove_collection | add_tag | remove_tag | set_price_pct */
export async function bulkProducts(ids, action, value) {
  await requireAdmin();
  if (!ids?.length) return { error: "Select at least one product" };
  const { data: rows } = await db().from("products").select("id,tags,collection_ids,collection_id,price").in("id", ids);
  if (action === "delete") { const { error } = await db().from("products").delete().in("id", ids); if (error) return { error: error.message }; refresh(); return { ok: true }; }
  if (action === "live" || action === "hide") { const { error } = await db().from("products").update({ active: action === "live" }).in("id", ids); if (error) return { error: error.message }; refresh(); return { ok: true }; }
  for (const r of rows || []) {
    let patch = {};
    if (action === "add_tag") patch.tags = [...new Set([...(r.tags || []), value])];
    if (action === "remove_tag") patch.tags = (r.tags || []).filter((t) => t !== value);
    if (action === "add_collection" || action === "remove_collection") {
      const cur = new Set(r.collection_ids?.length ? r.collection_ids : r.collection_id ? [r.collection_id] : []);
      action === "add_collection" ? cur.add(value) : cur.delete(value);
      patch.collection_ids = [...cur]; patch.collection_id = [...cur][0] || null;
    }
    if (action === "set_price_pct") patch.price = Math.max(0, Math.round(r.price * (1 + Number(value) / 100)));
    const { error } = await db().from("products").update(patch).eq("id", r.id); if (error) return { error: error.message };
  }
  refresh(); return { ok: true };
}
/** Collections page: choose exactly which products sit in one collection. */
export async function setCollectionProducts(collectionId, productIds) {
  await requireAdmin();
  const want = new Set(productIds);
  const { data: rows } = await db().from("products").select("id,collection_ids,collection_id");
  for (const r of rows || []) {
    const cur = new Set(r.collection_ids?.length ? r.collection_ids : r.collection_id ? [r.collection_id] : []);
    const has = cur.has(collectionId), should = want.has(r.id);
    if (has === should) continue;
    should ? cur.add(collectionId) : cur.delete(collectionId);
    const { error } = await db().from("products").update({ collection_ids: [...cur], collection_id: [...cur][0] || null }).eq("id", r.id);
    if (error) return { error: error.message };
  }
  refresh(); return { ok: true };
}
/** Inventory page: updates = [{ id, sizes: {"6": 4, ...} }] */
export async function saveInventory(updates) {
  await requireAdmin();
  for (const u of updates || []) {
    const sizes = Object.fromEntries(Object.entries(u.sizes || {}).map(([k, n]) => [k, Math.max(0, Math.round(Number(n) || 0))]));
    const { error } = await db().from("products").update({ sizes }).eq("id", u.id); if (error) return { error: error.message };
  }
  refresh(); revalidatePath("/admin/inventory"); return { ok: true };
}
/** CSV import (Shopify-style). Matches existing products by slug (or SKU) and updates; otherwise creates. */
export async function importProducts(csvText) {
  await requireAdmin();
  const rows = parseCSV(csvText); const out = { created: 0, updated: 0, errors: [] };
  if (!rows.length) return { ...out, errors: ["The file has no rows."] };
  const [{ data: cols }, { data: existing }] = await Promise.all([db().from("collections").select("id,slug"), db().from("products").select("id,slug,sku")]);
  const colBySlug = Object.fromEntries((cols || []).map((c) => [c.slug, c.id]));
  const list = (x) => String(x || "").split(/[|;]/).map((t) => t.trim()).filter(Boolean);
  let line = 1;
  for (const r of rows) {
    line++;
    const name = r.name || r.title; if (!name) { out.errors.push(`Row ${line}: name is missing`); continue; }
    const sizes = {}; for (const k of Object.keys(r)) { const m = k.match(/^(?:size|stock)_(\d+(?:\.\d)?)$/); if (m && r[k] !== "") sizes[m[1]] = Number(r[k]) || 0; }
    const colSlugs = list(r.collections); const unknown = colSlugs.filter((c) => !colBySlug[c]);
    if (unknown.length) out.errors.push(`Row ${line}: unknown collection(s) ${unknown.join(", ")} (ignored)`);
    const v = {
      name, slug: r.slug || slugify(name), price: r.price, compare_price: r.compare_price, cost_price: r.cost_price, weight_g: r.weight_g, sku: r.sku, barcode: r.barcode,
      vendor: r.vendor, product_type: r.product_type, seo_title: r.seo_title, seo_description: r.seo_description,
      description: r.description, long_description: r.long_description, details: String(r.details || "").split("||").join("\n"),
      images: list(r.images), colors: list(r.colors), tags: list(r.tags), sizes,
      collection_ids: colSlugs.map((c) => colBySlug[c]).filter(Boolean),
      active: !/^(false|no|0|hidden|draft)$/i.test(r.active || "true"), featured: /^(true|yes|1)$/i.test(r.featured || ""), low_stock: r.low_stock || 3, sort_order: r.sort_order || 0,
    };
    const row = productRow(v);
    if (row.price == null || Number.isNaN(row.price)) { out.errors.push(`Row ${line} (${name}): price is missing`); continue; }
    const match = (existing || []).find((e) => e.slug === row.slug || (row.sku && e.sku === row.sku));
    if (match) {
      // only overwrite sizes if the CSV has size columns; keep images if the CSV has none
      if (!Object.keys(sizes).length) delete row.sizes;
      if (!row.images.length) delete row.images;
      if (!colSlugs.length) { delete row.collection_ids; delete row.collection_id; }
      row.slug = match.slug;
      const { error } = await db().from("products").update(row).eq("id", match.id);
      error ? out.errors.push(`Row ${line} (${name}): ${error.message}`) : out.updated++;
    } else {
      const { data, error } = await db().from("products").insert(row).select("id,slug,sku").single();
      if (error) out.errors.push(`Row ${line} (${name}): ${error.code === "23505" ? "duplicate slug/SKU" : error.message}`);
      else { out.created++; (existing || []).push(data); }
    }
  }
  refresh(); revalidatePath("/admin/products"); return out;
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
  for (const k of ["free_shipping_min", "shipping_fee", "return_days", "exchange_days", "refund_days", "cod_fee", "cod_prepaid_pct"]) next[k] = Number(next[k]) || 0;
  next.cod_enabled = next.cod_enabled !== false && next.cod_enabled !== "false";
  next.whatsapp = String(next.whatsapp || "").replace(/[^\d]/g, "");
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
  if (v.cod_collected && before.amount_due > 0) { patch.amount_paid = before.total; patch.amount_due = 0; }
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
