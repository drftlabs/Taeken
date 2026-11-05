import Hero from "./Hero";
import ProductGrid from "./ProductGrid";
import { Media, SmartLink, Arrow, lines } from "./Media";
import DM from "./DM";

function Head({ t }) {
  const parts = String(t || "").split("|");
  return <>{parts.map((l, i) => (i === parts.length - 1 && parts.length > 1 ? <em key={i}> {l}</em> : <span key={i}>{l} </span>))}</>;
}

export function ProductsBlock({ c, products, colors }) {
  // rows shown before the blurred "View all" (0 = show everything). Older blocks: the old checkbox decides.
  const rows = c.rows !== undefined && c.rows !== "" ? Math.max(0, Math.floor(Number(c.rows)) || 0) : c.collapse === false ? 0 : 2;
  return (
    <section className="sec shop" id="shop" aria-label={c.title}>
      <div className="wrap">
        <div className="sec-head">
          <div><p className="eyebrow">{c.eyebrow}</p><h2 className="h2"><Head t={c.title} /></h2></div>
          <span className="note"><DM n={3} /></span>
        </div>
        <ProductGrid products={products} colors={colors} collapse={rows > 0} rows={rows || 2} />
      </div>
    </section>
  );
}

export function BannerBlock({ c }) {
  const next = c.variant === "next";
  return (
    <section className={"banner" + (next ? " next" : "")} aria-label={c.title}>
      <Media src={c.image} mobile={c.image_mobile} alt={String(c.title || "").replace("|", " ")} position={c.position} fit={c.fit} ghost={next ? "闘" : "走"} tag={next ? "IMG 06" : "IMG 04"} />
      <div className="shade" /><div className="tape" aria-hidden="true" />
      {!next && <span className="vert" aria-hidden="true">走り屋</span>}
      <div className="b-in">
        <div className="b-left" style={next ? { alignItems: "flex-end" } : undefined}>{c.plate && <span className="plate">No.<b>{c.plate}</b></span>}<span className="vk">{c.kicker}</span></div>
        <div className="b-right"><h2 className="b-title">{lines(c.title).map((l, i) => <span key={i}>{l}{i < String(c.title).split("|").length - 1 && <br />}</span>)}</h2>
          {c.cta_text && <SmartLink className="btn" href={c.link}>{c.cta_text}<Arrow /></SmartLink>}</div>
      </div>
    </section>
  );
}

export function CollectionsBlock({ c, collections }) {
  const shown = collections.filter((x) => x.show_home !== false);
  return (
    <section className="sec shapes" id="collections" aria-label={c.title}>
      <span className="bigk" aria-hidden="true">形</span>
      <div className="wrap wide">
        <div className="sec-head">
          <div><p className="eyebrow">{c.eyebrow}</p><h2 className="h2"><Head t={c.title} /></h2></div>
          <span className="note">{String(shown.length).padStart(2, "0")} silhouettes</span>
        </div>
        <div className="tiles">
          {shown.map((col, i) => (
            <SmartLink key={col.id} className="tile" href={`/collections/${col.slug}`} aria-label={`${col.name} collection`}>
              <div className="t-img"><Media src={col.image} alt={col.name} position={col.position} ghost={col.kanji} tag={`IMG ${String(i + 1).padStart(2, "0")}`} />{col.kanji && <span className="vert" aria-hidden="true">{col.kanji}</span>}</div>
              <div className="t-meta"><div><span className="no">{String(i + 1).padStart(2, "0")} / Series</span><h3>{col.name}</h3></div><span className="go"><Arrow /></span></div>
            </SmartLink>
          ))}
        </div>
      </div>
    </section>
  );
}

export function StoryBlock({ c }) {
  return (
    <section id="story" aria-label={c.title}>
      <div className="story">
        <div className="s-img"><Media src={c.image} alt="Taeken story" position={c.position} ghost="街" tag="IMG 05" /><span className="vert" aria-hidden="true">Street series</span></div>
        <div className="s-copy">
          <span className="stamp" aria-hidden="true">街</span>
          <p className="eyebrow">{c.eyebrow}</p>
          <h2 className="h2">{String(c.title).split("|").map((l, i, a) => <span key={i}>{i === a.length - 1 && a.length > 1 ? <em>{l}</em> : l}{i < a.length - 1 && <br />}</span>)}</h2>
          <p>{c.text}</p>
          <div className="pillars"><span>Distinctive</span><span>Everyday</span><span>Accessible</span></div>
          {c.link_text && <SmartLink className="link" href={c.link || "/our-story"}>{c.link_text}</SmartLink>}
        </div>
      </div>
    </section>
  );
}

export function HeroBlock({ slides }) { return <Hero slides={slides} />; }

// Large full-width picture. Any shape: "contain" shows the whole image (e.g. 1:1), "cover" fills the strip.
export function ImageBlock({ c }) {
  if (!c.image) return null;
  const img = <picture>{c.image_mobile && <source media="(max-width:600px)" srcSet={c.image_mobile} />}<img src={c.image} alt={c.alt || c.title || ""} loading="lazy" decoding="async" /></picture>;
  return (
    <section className={"bigimg " + (c.fit === "cover" ? "cover" : "contain")} aria-label={c.title || "Featured image"}>
      <DM className="bi-dm l" dir="right" n={3} /><DM className="bi-dm r" dir="left" n={3} />
      {c.link ? <SmartLink href={c.link} className="bi-in">{img}</SmartLink> : <div className="bi-in">{img}</div>}
      {c.caption && <p className="bi-cap"><span>{c.caption}</span></p>}
    </section>
  );
}
