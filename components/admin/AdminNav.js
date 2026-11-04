"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase/client";

const NAV = [
  ["Overview", [["/admin", "Dashboard"]]],
  ["Sales", [["/admin/orders", "Orders"], ["/admin/discounts", "Discount codes"], ["/admin/messages", "Messages & complaints"]]],
  ["Catalogue", [["/admin/products", "Products"], ["/admin/inventory", "Inventory"], ["/admin/collections", "Collections"], ["/admin/tags", "Tags"], ["/admin/colors", "Colours"]]],
  ["Homepage", [["/admin/blocks", "Block placement"], ["/admin/slides", "Hero slides"]]],
  ["Site", [["/admin/pages", "Legal pages"], ["/admin/settings", "Settings"]]],
];
export default function AdminNav({ email }) {
  const path = usePathname(), router = useRouter();
  const on = (h) => (h === "/admin" ? path === h : path.startsWith(h));
  return (
    <aside className="adm-side">
      <div className="brand"><img src="/logo.png" alt="" /><div>TAEKEN<small>ADMIN</small></div></div>
      {NAV.map(([g, links]) => <div key={g}><div className="grp">{g}</div>{links.map(([h, l]) => <Link key={h} href={h} className={on(h) ? "on" : ""}>{l}</Link>)}</div>)}
      <div className="grp">Account</div>
      <a href="/" target="_blank" rel="noopener">View store ↗</a>
      <button onClick={async () => { await browserClient().auth.signOut(); router.replace("/admin/login"); router.refresh(); }}>Sign out<br /><span style={{ fontSize: 10, color: "#8a8a8f", fontWeight: 500 }}>{email}</span></button>
    </aside>
  );
}
