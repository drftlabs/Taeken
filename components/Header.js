"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useShop } from "./ShopProvider";

export default function Header({ ticker }) {
  const { count, setDrawer, pulse } = useShop();
  const bagRef = useRef();
  useEffect(() => { if (!pulse) return; const el = bagRef.current; if (!el) return; el.classList.remove("pulse"); void el.offsetWidth; el.classList.add("pulse"); }, [pulse]);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const router = useRouter();
  return (
    <div className="top">
      {ticker}
      <header className="bar">
        <button className="ib burger" aria-label="Open menu" aria-expanded={menu} aria-controls="nav" onClick={() => setMenu(!menu)}><svg viewBox="0 0 24 24"><path d="M3 7h18M3 12h18M3 17h18" /></svg></button>
        <Link className="logo" href="/" aria-label="Taeken home"><img src="/logo.png" alt="Taeken" width="46" height="28" /></Link>
        <nav className={"nav" + (menu ? " open" : "")} id="nav" aria-label="Primary" onClick={() => setMenu(false)}>
          <Link href="/collections/all">Shop</Link><Link href="/#collections">Collections</Link><Link href="/our-story">Our story</Link>
        </nav>
        <div className="tools">
          <button className="ib" aria-label="Search" aria-expanded={search} onClick={() => setSearch(!search)}><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg></button>
          <Link className="ib" href="/account" aria-label="Account: log in or sign up"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4.5 4.2-6.5 8-6.5s7 2 8 6.5" /></svg></Link>
          <button ref={bagRef} data-bag className="bagbtn" aria-label={`Open shopping bag, ${count} item${count === 1 ? "" : "s"}`} onClick={() => setDrawer(true)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l1 12.5H4L5 8Z" /><path d="M9 10V6.5a3 3 0 0 1 6 0V10" /></svg><span className="lbl">Bag</span><span className="count">{count}</span>
          </button>
        </div>
      </header>
      {search && (
        <form className="searchbar open" role="search" onSubmit={(e) => { e.preventDefault(); const q = new FormData(e.target).get("q"); if (q) { setSearch(false); router.push("/search?q=" + encodeURIComponent(q)); } }}>
          <label className="sr" htmlFor="q">Search sneakers</label>
          <input id="q" name="q" type="search" placeholder="Search sneakers" autoComplete="off" autoFocus />
        </form>
      )}
    </div>
  );
}
