"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useShop } from "./ShopProvider";
import { inr, kanjiFor } from "@/lib/format";
import { Arrow } from "./Media";
import DM from "./DM";

export const sizeList = (p) => Object.keys(p.sizes || {}).sort((a, b) => a - b);
export const totalStock = (p) => Object.values(p.sizes || {}).reduce((t, n) => t + (Number(n) || 0), 0);

export default function ProductCard({ p, colorMap = {}, extra = false, inert = false, index = 0 }) {
  const { add, wish, toggleWish } = useShop();
  const [sizing, setSizing] = useState(false);
  const [added, setAdded] = useState(false);
  const opts = (p.colors || []).map((c) => ({ slug: c, name: colorMap[c]?.name || c, hex: colorMap[c]?.hex || "#777" }));
  const [ci, setCi] = useState(0), color = opts[ci] || null;
  const ref = useRef();
  const sold = totalStock(p) === 0;
  useEffect(() => {
    if (!sizing) return;
    const out = (e) => ref.current && !ref.current.contains(e.target) && setSizing(false);
    const esc = (e) => e.key === "Escape" && setSizing(false);
    document.addEventListener("click", out); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("click", out); document.removeEventListener("keydown", esc); };
  }, [sizing]);
  const saved = wish.includes(p.id);
  return (
    <article ref={ref} className={"card" + (extra ? " extra" : "") + (sizing ? " sizing" : "")} style={{ "--i": index }} inert={inert ? "" : undefined}>
      <div className="p-visual" data-k={kanjiFor(p.slug)} data-n={String(index + 1).padStart(2, "0")}>
        <Link className={"p-img" + (p.images?.[0] ? " has-img" : "") + (p.images?.[1] ? " has-alt" : "")} href={`/products/${p.slug}`} aria-label={`${p.name}, ${inr(p.price)}`}>
          {p.images?.[0] ? <><img className="i1" src={p.images[0]} alt={p.name} loading="lazy" decoding="async" />{p.images[1] && <img className="i2" src={p.images[1]} alt="" aria-hidden="true" loading="lazy" decoding="async" />}</> : <span className="corners" />}
        </Link>
        <DM className="card-dm" n={2} />
        {p.tagObjs?.length > 0 && <div className="tags">{p.tagObjs.slice(0, 2).map((t) => <span key={t.slug} className="tag" style={{ background: t.bg, color: t.fg }}>{t.name}</span>)}</div>}
        <button className="heart" aria-pressed={saved} aria-label={`${saved ? "Remove" : "Save"} ${p.name} ${saved ? "from" : "to"} wishlist`} onClick={() => toggleWish(p)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z" /></svg>
        </button>
        <div className="sizes" role="group" aria-label={`Choose a UK size for ${p.name}`}>
          <p><span>Select UK size</span><button aria-label="Close sizes" onClick={() => setSizing(false)}>×</button></p>
          {opts.length > 0 && <div className="cl" role="radiogroup" aria-label="Colour"><span>Colour: <b>{color?.name}</b></span><div>{opts.map((o, k) => <button key={o.slug} role="radio" aria-checked={k === ci} aria-label={o.name} title={o.name} className={k === ci ? "on" : ""} onClick={() => setCi(k)}><i style={{ background: o.hex }} /></button>)}</div></div>}
          <div className="sz">
            {sizeList(p).map((s) => Number(p.sizes[s]) > 0
              ? <button key={s} aria-label={`UK ${s}`} onClick={() => { add(p, s, 1, false, color, ref.current?.querySelector(".p-img img, .p-img")); setSizing(false); setAdded(true); setTimeout(() => setAdded(false), 1200); }}>{s}</button>
              : <button key={s} disabled aria-label={`UK ${s}, sold out`}>{s}</button>)}
          </div>
        </div>
      </div>
      <div className="p-info">
        <h3 className="p-name"><Link href={`/products/${p.slug}`}><span>{p.name}</span></Link></h3>
        <div className="p-row">
          <span className="price">{inr(p.price)}{p.compare_price > p.price && <s style={{ color: "var(--concrete)", fontWeight: 500, marginLeft: 8, fontSize: 13 }}>{inr(p.compare_price)}</s>}</span>
          {p.colors?.length > 1 && <span className="sw" aria-label={`${p.colors.length} colours`}>{p.colors.map((c) => <i key={c} style={{ background: colorMap[c]?.hex || "#777" }} title={colorMap[c]?.name || c} />)}</span>}
        </div>
      </div>
      <button className={"add" + (added ? " ok" : "")} disabled={sold} style={sold ? { opacity: .5, cursor: "not-allowed" } : undefined} aria-label={sold ? `${p.name} is sold out` : `Add ${p.name} to cart`} onClick={(e) => { e.stopPropagation(); setSizing(true); }}>
        <span>{sold ? "Sold out" : added ? "Added" : "Add to cart"}</span>{!sold && <Arrow />}
      </button>
    </article>
  );
}
