// Used only when Supabase env vars are missing (local preview). Mirrors supabase/seed.sql.
export const SETTINGS = {
  business_name: "Taeken", legal_name: "[Your registered business name]", address: "[Registered business address]",
  contact_email: "hello@taeken.in", contact_phone: "", gst_number: "", instagram: "",
  ticker: ["Free shipping above ₹1,499", "Drop 01 is live", "Make your mark", "街 Street series 001"],
  free_shipping_min: 1499, shipping_fee: 99, dispatch_days: "1–2 business days", delivery_days: "3–4 business days",
  return_days: 7, exchange_days: 7, refund_days: 7, jurisdiction: "[City], India", grievance_name: "[Grievance Officer name]", sizes: "6,7,8,9,10,11",
  cod_enabled: true, cod_fee: 99, cod_prepaid_pct: 10, whatsapp: "",
};
export const TAGS = [
  { id: "t1", name: "New Drop", slug: "new-drop", bg: "#D7262B", fg: "#FFFFFF" },
  { id: "t2", name: "Bestseller", slug: "bestseller", bg: "#F5F3EE", fg: "#0B0B0B" },
  { id: "t3", name: "Limited", slug: "limited", bg: "#C7B299", fg: "#0B0B0B" },
  { id: "t4", name: "Sale", slug: "sale", bg: "#4D5A44", fg: "#FFFFFF" },
];
export const COLORS = [
  { id: "c1", name: "Obsidian", slug: "obsidian", hex: "#0B0B0B" }, { id: "c2", name: "Chalk", slug: "chalk", hex: "#F5F3EE" },
  { id: "c3", name: "Concrete", slug: "concrete", hex: "#8A8A8A" }, { id: "c4", name: "Red", slug: "red", hex: "#D7262B" },
  { id: "c5", name: "Olive", slug: "olive", hex: "#4D5A44" }, { id: "c6", name: "Sand", slug: "sand", hex: "#C7B299" },
];
export const COLLECTIONS = [
  { id: "k1", name: "High Tops", slug: "high-tops", kanji: "高", image: "", position: "50% 50%" },
  { id: "k2", name: "Court Classics", slug: "court-classics", kanji: "古", image: "", position: "50% 50%" },
  { id: "k3", name: "Chunky Sneakers", slug: "chunky-sneakers", kanji: "厚", image: "", position: "50% 50%" },
  { id: "k4", name: "Low Tops", slug: "low-tops", kanji: "低", image: "", position: "50% 50%" },
];
export const SLIDES = [
  { id: "s1", kicker: "Taeken / Series 001", title: "Make your|mark.", cta_text: "Shop the collection", link: "/collections/all", image: "", image_mobile: "", position: "50% 40%" },
  { id: "s2", kicker: "Drop 01 / New", title: "Fresh out|the box.", cta_text: "Shop new drop", link: "/collections/high-tops", image: "", image_mobile: "", position: "50% 50%" },
  { id: "s3", kicker: "Street series", title: "Own the|street.", cta_text: "Pick your shape", link: "/#collections", image: "", image_mobile: "", position: "50% 50%" },
];
export const BLOCKS = [
  { id: "b1", type: "hero", title: "Hero slider", config: {} },
  { id: "b2", type: "products", title: "Fresh out the box", config: { eyebrow: "Drop 01 / Latest", title: "Fresh|out the box", source: "all", source_value: "", limit: 12, collapse: true } },
  { id: "b2i", type: "image", title: "Large image", config: { image: "", fit: "contain" } },
  { id: "b3", type: "banner", title: "Campaign banner", config: { variant: "campaign", plate: "001", kicker: "Street series / Designed in India", title: "Not made|to blend in.", cta_text: "Shop the drop", link: "/collections/all", image: "", image_mobile: "", position: "50% 50%" } },
  { id: "b4", type: "collections", title: "Pick your shape", config: { eyebrow: "Collections", title: "Pick your|shape" } },
  { id: "b5", type: "story", title: "Brand story", config: { eyebrow: "Our story", title: "Born in India.|Built on the street.", text: "Taeken is an Indian-born streetwear sneaker brand shaped by music, urban culture, movement and individual expression. Distinctive design. Everyday wearability. An accessible price.", link_text: "Read our story", link: "/our-story", image: "", position: "50% 40%" } },
  { id: "b6", type: "banner", title: "Next drop banner", config: { variant: "next", plate: "002", kicker: "Next drop", title: "After hours.", cta_text: "Shop the collection", link: "/collections/all", image: "", image_mobile: "", position: "50% 50%" } },
];
const P = (n, slug, price, tags, colors, sizes, coll) => ({ id: "p-" + slug, name: n, slug, price, compare_price: null, description: "", details: "", images: [], colors, tags, sizes, collection_id: coll, active: true });
const S = (...a) => Object.fromEntries([6, 7, 8, 9, 10, 11].map((s, i) => [String(s), a[i]]));
export const PRODUCTS = [
  P("Afterhours High", "afterhours-high", 2299, ["new-drop"], ["obsidian", "chalk", "red"], S(6, 6, 8, 6, 4, 0), "k1"),
  P("Court Classic", "court-classic", 1899, ["bestseller"], ["chalk", "obsidian"], S(0, 5, 8, 8, 5, 3), "k2"),
  P("Terrain Chunky", "terrain-chunky", 2499, ["new-drop"], ["concrete", "red"], S(4, 0, 6, 6, 4, 0), "k3"),
  P("Origin Low", "origin-low", 1699, [], ["chalk", "sand", "olive"], S(5, 5, 8, 8, 6, 4), "k4"),
  P("Signal High", "signal-high", 2399, [], ["obsidian", "red"], S(0, 4, 5, 5, 0, 0), "k1"),
  P("Concrete Court", "concrete-court", 1799, [], ["concrete", "chalk"], S(4, 5, 5, 5, 3, 0), "k2"),
  P("Night Chunky", "night-chunky", 2199, ["limited"], ["obsidian", "olive"], S(0, 0, 4, 4, 4, 3), "k3"),
  P("Daily Low", "daily-low", 1599, [], ["sand", "chalk"], S(4, 4, 0, 5, 5, 0), "k4"),
  P("Midnight High", "midnight-high", 2499, [], ["obsidian"], S(0, 5, 6, 6, 5, 3), "k1"),
  P("Slab Court", "slab-court", 1999, [], ["chalk", "red"], S(4, 5, 5, 4, 0, 0), "k2"),
  P("Apex Chunky", "apex-chunky", 2299, [], ["concrete", "obsidian"], S(0, 0, 5, 5, 4, 0), "k3"),
  P("Corner Low", "corner-low", 1699, [], ["olive", "chalk"], S(5, 5, 6, 6, 5, 4), "k4"),
];
