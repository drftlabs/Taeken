import { publicClient } from "./supabase/server";
import * as fb from "./fallback";

// All storefront reads. Falls back to demo data when Supabase isn't configured yet.
async function q(table, build, fallback) {
  const sb = publicClient();
  if (!sb) return fallback;
  let query = sb.from(table).select("*");
  if (build) query = build(query);
  const { data, error } = await query;
  if (error) { console.error(`[data:${table}]`, error.message); return fallback; }
  return data;
}

export async function getSettings() {
  const sb = publicClient();
  if (!sb) return fb.SETTINGS;
  const { data } = await sb.from("site_settings").select("value").eq("key", "site").maybeSingle();
  return { ...fb.SETTINGS, ...(data?.value || {}) };
}
export const getTags = () => q("tags", (x) => x.order("sort_order"), fb.TAGS);
export const getColors = () => q("colors", (x) => x.order("sort_order"), fb.COLORS);
export const getCollections = () => q("collections", (x) => x.order("sort_order"), fb.COLLECTIONS);
export const getSlides = () => q("slides", (x) => x.order("sort_order"), fb.SLIDES);
export const getBlocks = () => q("blocks", (x) => x.order("sort_order"), fb.BLOCKS);

export function attachTags(products, tags) {
  const map = Object.fromEntries(tags.map((t) => [t.slug, t]));
  return products.map((p) => ({ ...p, tagObjs: (p.tags || []).map((s) => map[s]).filter(Boolean) }));
}

export const inCollection = (p, id) => p.collection_id === id || (p.collection_ids || []).includes(id);

export async function getProducts({ collectionId, tag, search, sort, limit, ids, excludeId } = {}) {
  const tags = await getTags();
  const filters = (x, modern) => {
    if (collectionId) x = modern ? x.or(`collection_id.eq.${collectionId},collection_ids.cs.{${collectionId}}`) : x.eq("collection_id", collectionId);
    if (tag) x = x.contains("tags", [tag]);
    if (ids) x = x.in("id", ids);
    return x;
  };
  // "modern" uses columns added by migration_2.sql; if that hasn't been run yet we quietly fall back to the original columns.
  let list = await q("products", (x) => filters(x.order("featured", { ascending: false }).order("sort_order").order("created_at", { ascending: false }), true), null);
  if (!list) list = await q("products", (x) => filters(x.order("sort_order").order("created_at", { ascending: false }), false), fb.PRODUCTS);
  // fallback data ignores query filters, so filter again in JS (harmless for real data)
  if (collectionId) list = list.filter((p) => inCollection(p, collectionId));
  if (tag) list = list.filter((p) => (p.tags || []).includes(tag));
  if (ids) list = list.filter((p) => ids.includes(p.id));
  if (excludeId) list = list.filter((p) => p.id !== excludeId);
  if (search) { const s = search.toLowerCase(); list = list.filter((p) => p.name.toLowerCase().includes(s)); }
  if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
  if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
  if (limit) list = list.slice(0, limit);
  return attachTags(list, tags);
}

export async function getProductBySlug(slug) {
  const list = await getProducts();
  return list.find((p) => p.slug === slug) || null;
}
export async function getCollectionBySlug(slug) {
  const list = await getCollections();
  return list.find((c) => c.slug === slug) || null;
}
export async function getPageOverride(slug) {
  const sb = publicClient();
  if (!sb) return null;
  const { data } = await sb.from("pages").select("title,body").eq("slug", slug).maybeSingle();
  return data || null;
}
export const inStock = (p) => Object.values(p.sizes || {}).some((n) => Number(n) > 0);
