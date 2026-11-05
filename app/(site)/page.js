import { getBlocks, getSlides, getCollections, getProducts, getColors, inCollection } from "@/lib/data";
import Tape from "@/components/Tape";
import { HeroBlock, ProductsBlock, BannerBlock, CollectionsBlock, StoryBlock, ImageBlock } from "@/components/HomeBlocks";
import WhyTaeken from "@/components/WhyTaeken";
import { getSettings } from "@/lib/data";
import { shippingCfg } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [blocks, slides, collections, colors] = await Promise.all([getBlocks(), getSlides(), getCollections(), getColors()]);
  const all = await getProducts();
  const settings = await getSettings();
  const bySlug = Object.fromEntries(collections.map((c) => [c.slug, c]));
  const productsFor = (c) => {
    let list = all;
    if (c.source === "pick") { const ids = Array.isArray(c.product_ids) ? c.product_ids : []; return ids.map((id) => all.find((p) => p.id === id)).filter(Boolean); }
    if (c.source === "tag" && c.source_value) list = list.filter((p) => (p.tags || []).includes(c.source_value));
    if (c.source === "collection" && c.source_value && bySlug[c.source_value]) list = list.filter((p) => inCollection(p, bySlug[c.source_value].id));
    return list.slice(0, Number(c.limit) || 12);
  };
  return (
    <>
      {blocks.map((b) => {
        const c = b.config || {};
        switch (b.type) {
          case "hero": return <HeroBlock key={b.id} slides={slides} />;
          case "products": return <div key={b.id}><ProductsBlock c={{ ...c, title: c.title || b.title }} products={productsFor(c)} colors={colors} /><Tape /></div>;
          case "banner": return <BannerBlock key={b.id} c={{ ...c, title: c.title || b.title }} />;
          case "collections": return <div key={b.id}><CollectionsBlock c={c} collections={collections} /><Tape light /></div>;
          case "image": return <ImageBlock key={b.id} c={{ ...c, title: c.title || b.title }} />;
          case "story": return <div key={b.id}><StoryBlock c={c} /><WhyTaeken /></div>;
          default: return null;
        }
      })}
    </>
  );
}
