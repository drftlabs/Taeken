import { getBlocks, getSlides, getCollections, getProducts, getColors, inCollection } from "@/lib/data";
import Tape from "@/components/Tape";
import { HeroBlock, ProductsBlock, BannerBlock, CollectionsBlock, StoryBlock } from "@/components/HomeBlocks";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [blocks, slides, collections, colors] = await Promise.all([getBlocks(), getSlides(), getCollections(), getColors()]);
  const all = await getProducts();
  const bySlug = Object.fromEntries(collections.map((c) => [c.slug, c]));
  const productsFor = (c) => {
    let list = all;
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
          case "story": return <StoryBlock key={b.id} c={c} />;
          default: return null;
        }
      })}
    </>
  );
}
