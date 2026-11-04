"use client";
import { useRef, useState } from "react";
import { useShop } from "./ShopProvider";
import { inr } from "@/lib/format";
import { Arrow } from "./Media";

export default function ProductBuy({ p, sizeKeys }) {
  const { add, wish, toggleWish, say, setDrawer } = useShop();
  const [size, setSize] = useState(null), [err, setErr] = useState(false);
  const gridRef = useRef();
  const stock = size ? Number(p.sizes[size]) : 0;
  const sold = sizeKeys.every((s) => Number(p.sizes[s]) <= 0);
  const submit = (buyNow) => {
    if (!size) { setErr(true); gridRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); say("Select your UK size first"); return; }
    add(p, size); if (buyNow) setDrawer(true);
  };
  const saved = wish.includes(p.id);
  return (
    <>
      <div className="opt-label"><span>UK size</span>{size ? <b>UK {size}</b> : <span>Select one</span>}</div>
      <div className={"size-grid" + (err && !size ? " err" : "")} ref={gridRef} role="radiogroup" aria-label="UK size">
        {sizeKeys.map((s) => <button key={s} role="radio" aria-checked={size === s} className={size === s ? "on" : ""} disabled={Number(p.sizes[s]) <= 0} onClick={() => { setSize(s); setErr(false); }} aria-label={`UK ${s}${Number(p.sizes[s]) <= 0 ? ", sold out" : ""}`}>{s}</button>)}
      </div>
      {size && stock > 0 && stock <= 3 && <p className="low">Only {stock} left in this size</p>}
      <div className="pdp-actions">
        <button className="btn" disabled={sold} onClick={() => submit(false)}>{sold ? "Sold out" : "Add to bag"}{!sold && <Arrow />}</button>
        <button className="heartbtn" aria-pressed={saved} aria-label={saved ? "Remove from wishlist" : "Save to wishlist"} onClick={() => toggleWish(p)}><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z" /></svg></button>
      </div>
      <div className="stickybar"><span className="p">{inr(p.price)}</span><button className="btn" disabled={sold} onClick={() => submit(false)}>{sold ? "Sold out" : size ? `Add UK ${size}` : "Select size"}</button></div>
    </>
  );
}
