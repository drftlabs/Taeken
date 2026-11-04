"use client";
import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";

const Ctx = createContext(null);
export const useShop = () => useContext(Ctx);

// Bag (saved in this browser), wishlist (browser, synced to the account when logged in), toast.
export default function ShopProvider({ children, shipping }) {
  const [items, setItems] = useState([]);
  const [wish, setWish] = useState([]);
  const [ready, setReady] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [email, setEmail] = useState(null);
  const [toast, setToast] = useState(null);
  const tm = useRef();

  useEffect(() => {
    let w = [];
    try { setItems(JSON.parse(localStorage.getItem("tk_cart") || "[]")); w = JSON.parse(localStorage.getItem("tk_wish") || "[]"); setWish(w); } catch {}
    setReady(true);
    fetch("/api/wishlist").then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (!d) return;
      setEmail(d.email);
      const merged = [...new Set([...d.ids, ...w])];
      setWish(merged);
      const extra = w.filter((x) => !d.ids.includes(x));
      if (extra.length) fetch("/api/wishlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: extra, on: true }) });
    }).catch(() => {});
  }, []);
  useEffect(() => { if (ready) try { localStorage.setItem("tk_cart", JSON.stringify(items)); } catch {} }, [items, ready]);
  useEffect(() => { if (ready) try { localStorage.setItem("tk_wish", JSON.stringify(wish)); } catch {} }, [wish, ready]);

  const say = useCallback((text, bag) => {
    setToast({ text, bag }); clearTimeout(tm.current); tm.current = setTimeout(() => setToast(null), bag ? 3400 : 2400);
  }, []);

  const add = (p, size, qty = 1) => {
    setItems((cur) => {
      const f = cur.find((i) => i.id === p.id && i.size === String(size));
      if (f) return cur.map((i) => (i === f ? { ...i, qty: Math.min(10, i.qty + qty) } : i));
      return [...cur, { id: p.id, slug: p.slug, name: p.name, price: p.price, image: p.images?.[0] || "", size: String(size), qty }];
    });
    say(`${p.name} · UK ${size} added`, true);
  };
  const setQty = (id, size, qty) => setItems((cur) => cur.map((i) => (i.id === id && i.size === size ? { ...i, qty } : i)).filter((i) => i.qty > 0));
  const remove = (id, size) => setItems((cur) => cur.filter((i) => !(i.id === id && i.size === size)));
  const clear = () => setItems([]);
  const toggleWish = (p) => {
    const on = !wish.includes(p.id);
    setWish((w) => (on ? [...w, p.id] : w.filter((x) => x !== p.id)));
    say(on ? `${p.name} saved to wishlist` : `${p.name} removed from wishlist`);
    fetch("/api/wishlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [p.id], on }) }).catch(() => {});
  };

  const count = items.reduce((t, i) => t + i.qty, 0);
  const subtotal = items.reduce((t, i) => t + i.qty * i.price, 0);
  const ship = subtotal === 0 ? 0 : subtotal >= shipping.min ? 0 : shipping.fee;

  return (
    <Ctx.Provider value={{ items, count, subtotal, ship, total: subtotal + ship, shipping, add, setQty, remove, clear, wish, toggleWish, drawer, setDrawer, email, say, ready }}>
      {children}
      <div className={"toast" + (toast ? " show" : "")} role="status" aria-live="polite">
        <i /><span>{toast?.text}</span>
        {toast?.bag && <button onClick={() => { setToast(null); setDrawer(true); }}>View bag</button>}
      </div>
    </Ctx.Provider>
  );
}
