import Link from "next/link";
import { serviceClient } from "@/lib/supabase/server";
import { inr } from "@/lib/format";

export default async function Products() {
  const sb = serviceClient();
  const [{ data: prods }, { data: cols }, { data: tags }] = await Promise.all([sb.from("products").select("*").order("sort_order").order("created_at", { ascending: false }), sb.from("collections").select("id,name"), sb.from("tags").select("slug,name,bg,fg")]);
  const cn = Object.fromEntries((cols || []).map((c) => [c.id, c.name])), tm = Object.fromEntries((tags || []).map((t) => [t.slug, t]));
  return (
    <>
      <h1>Products</h1><p className="sub">Add listings, upload images, set stock by size, and apply tags.</p>
      <div className="bar-actions"><Link className="abtn" href="/admin/products/new">+ New product</Link></div>
      <div className="tblwrap"><table className="tbl"><thead><tr><th></th><th>Name</th><th>Collection</th><th>Price</th><th>Stock</th><th>Tags</th><th>Status</th></tr></thead><tbody>
        {(prods || []).map((p) => { const stock = Object.values(p.sizes || {}).reduce((t, n) => t + Number(n), 0); return (
          <tr key={p.id}><td><div className="thumbs-adm">{p.images?.[0] && <img src={p.images[0]} alt="" />}</div></td><td><Link href={`/admin/products/${p.id}`}><b>{p.name}</b></Link></td><td className="mut">{cn[p.collection_id] || "-"}</td><td>{inr(p.price)}</td><td style={stock <= 5 ? { color: "#ffb86b" } : undefined}>{stock}</td>
            <td>{(p.tags || []).map((s) => tm[s] && <span key={s} className="pill" style={{ background: tm[s].bg, color: tm[s].fg, marginRight: 4 }}>{tm[s].name}</span>)}</td><td>{p.active ? "Live" : <span className="mut">Hidden</span>}</td></tr>); })}
        {!prods?.length && <tr><td colSpan="7" className="mut">No products yet.</td></tr>}
      </tbody></table></div>
    </>
  );
}
