import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getProducts, getColors, getCollections, getSettings } from "@/lib/data";
import Gallery from "@/components/Gallery";
import ProductBuy from "@/components/ProductBuy";
import ProductGrid from "@/components/ProductGrid";
import PinCheck from "@/components/PinCheck";
import Prose from "@/components/Prose";
import { shippingCfg } from "@/lib/pricing";
import Reveal from "@/components/Reveal";
import DM from "@/components/DM";
import RecentlyViewed from "@/components/RecentlyViewed";
import { inr, SITE_URL, kanjiPair } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const p = await getProductBySlug(params.slug);
  if (!p) return { title: "Not found" };
  return { title: p.seo_title || p.name, description: p.seo_description || p.description || `${p.name} by Taeken, ${inr(p.price)}.`, openGraph: p.images?.[0] ? { images: [p.images[0]] } : undefined };
}

export default async function ProductPage({ params }) {
  const p = await getProductBySlug(params.slug);
  if (!p) notFound();
  const [colors, collections, settings] = await Promise.all([getColors(), getCollections(), getSettings()]);
  const col = collections.find((c) => c.id === p.collection_id);
  let related = await getProducts({ collectionId: p.collection_id, excludeId: p.id, limit: 4 });
  if (related.length < 4) { const more = await getProducts({ excludeId: p.id }); related = [...related, ...more.filter((m) => !related.some((r) => r.id === m.id))].slice(0, 4); }
  const sizeKeys = Object.keys(p.sizes || {}).sort((a, b) => a - b);
  const cmap = Object.fromEntries(colors.map((c) => [c.slug, c]));
  const cfg = shippingCfg(settings);
  const details = String(p.details || "").split("\n").map((l) => l.trim()).filter(Boolean);
  const ld = { "@context": "https://schema.org", "@type": "Product", name: p.name, image: p.images, description: p.description || p.name, brand: { "@type": "Brand", name: "Taeken" }, ...(p.sku ? { sku: p.sku } : {}), offers: { "@type": "Offer", priceCurrency: "INR", price: p.price, availability: sizeKeys.some((s) => p.sizes[s] > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `${SITE_URL}/products/${p.slug}` } };
  return (
    <div className="page has-sticky pdp-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="wrap">
        <div className="crumbs"><Link href="/">Home</Link>{col && <Link href={`/collections/${col.slug}`}>{col.name}</Link>}<span>{p.name}</span></div>
        <div className="pdp pdp-in">
          <div className="gal-col">
            <Gallery images={p.images || []} name={p.name} kanji={kanjiPair(p.slug)} />
            <span className="vtype vt-l" aria-hidden="true"><b>TAEKEN</b><i>走り屋</i><em>STREET SERIES 001</em></span>
            <DM className="gal-dm" dir="down" n={3} />
          </div>
          <div className="pdp-info">
            <span className="vtype vt-r" aria-hidden="true"><i>魂</i><b>MAKE YOUR MARK</b><em>街の闘い</em></span>
            {p.tagObjs?.length > 0 && <div className="tags">{p.tagObjs.map((t) => <span key={t.slug} className="tag" style={{ background: t.bg, color: t.fg }}>{t.name}</span>)}</div>}
            <h1 className="pdp-name"><span>{p.name}</span></h1>
            <div className="pdp-price"><span>{inr(p.price)}</span>{p.compare_price > p.price && <s>{inr(p.compare_price)}</s>}</div>
            <p className="pdp-tax">Inclusive of all taxes.</p>
            {p.description && <p className="pdp-desc">{p.description}</p>}
            <ProductBuy p={p} sizeKeys={sizeKeys} cod={cfg.codEnabled} colorOpts={(p.colors || []).map((c) => ({ slug: c, name: cmap[c]?.name || c, hex: cmap[c]?.hex || "#777" }))} />
            <PinCheck days={settings.delivery_days} cod={cfg.codEnabled} etaMin={cfg.etaMin} etaMax={cfg.etaMax} />
            <Reveal as="ul" className="trust2" delay={80}>
              <li><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="1" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg><b>Secure payment</b><small>UPI, cards, netbanking</small></li>
              <li><svg viewBox="0 0 24 24"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="17" r="1.6" /><circle cx="17" cy="17" r="1.6" /></svg><b>{Number(settings.free_shipping_min) > 0 ? `Free shipping ${inr(settings.free_shipping_min)}+` : "Fast delivery"}</b><small>{settings.delivery_days}</small></li>
              <li><svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 14-5l2 2M20 12a8 8 0 0 1-14 5l-2-2M20 4v5h-5M4 20v-5h5" /></svg><b>{settings.return_days}-day returns</b><small>Easy exchange</small></li>
              {cfg.codEnabled && <li><svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="1" /><circle cx="12" cy="12" r="2.5" /></svg><b>Cash on delivery</b><small>Pay {cfg.codPct}% now</small></li>}
            </Reveal>
            {p.images?.length > 0 && <Reveal className="pdp-last" delay={60}>
              <span className="pl-k" aria-hidden="true">{kanjiPair(p.slug)[1]}</span><span className="pl-g" aria-hidden="true" />
              <img src={p.images[p.images.length - 1]} alt={`${p.name}, final view`} loading="lazy" decoding="async" />
              <DM className="pl-dm" n={3} /><span className="pl-t" aria-hidden="true">No.01 · {p.name}</span>
            </Reveal>}
            <Reveal className="acc" delay={120}>
              <details open><summary>Details</summary><div className="body">{details.length ? <ul>{details.map((d, i) => <li key={i}>{d}</li>)}</ul> : <p>Distinctive design for everyday wear.</p>}</div></details>
              <details><summary>Shipping &amp; delivery</summary><div className="body"><p>Dispatched within {settings.dispatch_days}; delivered in {settings.delivery_days}. <Link className="link" href="/policies/shipping">Shipping policy</Link></p></div></details>
              <details><summary>Returns &amp; exchanges</summary><div className="body"><p>Return within {settings.return_days} days of delivery, or exchange your size within {settings.exchange_days} days, subject to the conditions in our policies. <Link className="link" href="/policies/returns">Returns</Link> · <Link className="link" href="/policies/exchange">Exchanges</Link></p></div></details>
            </Reveal>
          </div>
        </div>
        {p.long_description && <Reveal as="section" className="story"><span className="story-k" aria-hidden="true">物語</span><div className="story-in"><p className="eyebrow">The story</p><Prose text={p.long_description} /></div></Reveal>}
        {p.extra_images?.length > 0 && <Reveal as="section" className="look" aria-label="More photos"><p className="eyebrow">Look closer</p><div className="look-grid">{p.extra_images.map((src, i) => <figure key={i}><img src={src} alt={`${p.name}, detail ${i + 1}`} loading="lazy" decoding="async" /></figure>)}</div></Reveal>}
        <RecentlyViewed slug={p.slug} />
        {related.length > 0 && <Reveal as="section" className="related"><div className="sec-head"><div><p className="eyebrow">Recommended</p><h2 className="h2">You may <em>also like</em></h2></div></div><ProductGrid products={related} colors={colors} collapse={false} /></Reveal>}
      </div>
    </div>
  );
}
