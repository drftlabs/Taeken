import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getProducts, getColors, getCollections, getSettings } from "@/lib/data";
import Gallery from "@/components/Gallery";
import ProductBuy from "@/components/ProductBuy";
import ProductGrid from "@/components/ProductGrid";
import { inr, SITE_URL } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const p = await getProductBySlug(params.slug);
  if (!p) return { title: "Not found" };
  return { title: p.name, description: p.description || `${p.name} by Taeken, ${inr(p.price)}.`, openGraph: p.images?.[0] ? { images: [p.images[0]] } : undefined };
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
  const details = String(p.details || "").split("\n").map((l) => l.trim()).filter(Boolean);
  const ld = { "@context": "https://schema.org", "@type": "Product", name: p.name, image: p.images, description: p.description || p.name, brand: { "@type": "Brand", name: "Taeken" }, offers: { "@type": "Offer", priceCurrency: "INR", price: p.price, availability: sizeKeys.some((s) => p.sizes[s] > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `${SITE_URL}/products/${p.slug}` } };
  return (
    <div className="page has-sticky">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="wrap">
        <div className="crumbs"><Link href="/">Home</Link>{col && <Link href={`/collections/${col.slug}`}>{col.name}</Link>}<span>{p.name}</span></div>
        <div className="pdp">
          <Gallery images={p.images || []} name={p.name} />
          <div>
            {p.tagObjs?.length > 0 && <div className="tags">{p.tagObjs.map((t) => <span key={t.slug} className="tag" style={{ background: t.bg, color: t.fg }}>{t.name}</span>)}</div>}
            <h1 className="pdp-name">{p.name}</h1>
            <div className="pdp-price"><span>{inr(p.price)}</span>{p.compare_price > p.price && <s>{inr(p.compare_price)}</s>}</div>
            <p className="pdp-tax">Inclusive of all taxes. {Number(settings.free_shipping_min) > 0 && <>Free shipping above {inr(settings.free_shipping_min)}.</>}</p>
            {p.description && <p className="pdp-desc">{p.description}</p>}
            {p.colors?.length > 0 && <><div className="opt-label"><span>Colour</span></div><div className="pdp-sw">{p.colors.map((c) => <span key={c}><i style={{ background: cmap[c]?.hex || "#777" }} />{cmap[c]?.name || c}</span>)}</div></>}
            <ProductBuy p={p} sizeKeys={sizeKeys} />
            <div className="trust"><span>Delivery in {settings.delivery_days}</span><span>{settings.exchange_days}-day size exchange</span><span>Secure payments by Razorpay (UPI, cards, netbanking)</span></div>
            <div className="acc">
              <details open><summary>Details</summary><div className="body">{details.length ? <ul>{details.map((d, i) => <li key={i}>{d}</li>)}</ul> : <p>Distinctive design for everyday wear.</p>}</div></details>
              <details><summary>Shipping &amp; delivery</summary><div className="body"><p>Dispatched within {settings.dispatch_days}; delivered in {settings.delivery_days}. <Link className="link" href="/policies/shipping">Shipping policy</Link></p></div></details>
              <details><summary>Returns &amp; exchanges</summary><div className="body"><p>Return within {settings.return_days} days of delivery, or exchange your size within {settings.exchange_days} days, subject to the conditions in our policies. <Link className="link" href="/policies/returns">Returns</Link> · <Link className="link" href="/policies/exchange">Exchanges</Link></p></div></details>
            </div>
          </div>
        </div>
        {related.length > 0 && <section className="related"><div className="sec-head"><div><p className="eyebrow">Recommended</p><h2 className="h2">You may <em>also like</em></h2></div></div><ProductGrid products={related} colors={colors} collapse={false} /></section>}
      </div>
    </div>
  );
}
