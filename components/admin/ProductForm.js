"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveProduct, deleteProduct } from "@/lib/actions/admin";
import { Field, uploadImage } from "./Fields";
import { slugify } from "@/lib/format";

export default function ProductForm({ product, collections, tags, colors, sizeKeys }) {
  const isNew = !product;
  const [p, setP] = useState(product || { name: "", slug: "", price: "", compare_price: "", description: "", details: "", images: [], colors: [], tags: [], sizes: Object.fromEntries(sizeKeys.map((s) => [s, 0])), collection_id: "", active: true, sort_order: 0 });
  const [msg, setMsg] = useState(null), [pending, start] = useTransition(), [up, setUp] = useState(false), router = useRouter();
  const set = (k) => (v) => setP((x) => ({ ...x, [k]: v }));
  const toggle = (k, v) => setP((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : [...x[k], v] }));
  async function addImages(e) {
    setUp(true); setMsg(null);
    try { const urls = []; for (const f of e.target.files) urls.push(await uploadImage(f, "products")); setP((x) => ({ ...x, images: [...x.images, ...urls] })); } catch (x) { setMsg({ err: x.message }); }
    setUp(false); e.target.value = "";
  }
  const move = (i, d) => setP((x) => { const a = [...x.images]; const j = i + d; if (j < 0 || j >= a.length) return x; [a[i], a[j]] = [a[j], a[i]]; return { ...x, images: a }; });
  const save = () => start(async () => {
    const res = await saveProduct(product?.id || null, { ...p, slug: p.slug || slugify(p.name) });
    if (res.error) return setMsg({ err: res.error });
    router.push("/admin/products"); router.refresh();
  });
  return (
    <div>
      <div className="panel"><h2 style={{ marginTop: 0 }}>Basics</h2>
        <div className="af">
          <Field f={{ name: "name", label: "Product name", type: "text" }} value={p.name} onChange={set("name")} />
          <Field f={{ name: "slug", label: "URL slug", type: "text", help: "taeken.in/products/<slug>. Leave blank to auto-create from the name." }} value={p.slug} onChange={set("slug")} />
          <Field f={{ name: "price", label: "Price (₹)", type: "number" }} value={p.price} onChange={set("price")} />
          <Field f={{ name: "compare_price", label: "Compare-at price (₹, optional)", type: "number", help: "Shown struck through when higher than price." }} value={p.compare_price ?? ""} onChange={set("compare_price")} />
          <div><label htmlFor="coll">Collection</label><select id="coll" value={p.collection_id || ""} onChange={(e) => set("collection_id")(e.target.value)}><option value="">None</option>{collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <Field f={{ name: "sort_order", label: "Sort order", type: "number", help: "Lower numbers show first." }} value={p.sort_order} onChange={set("sort_order")} />
          <Field f={{ name: "description", label: "Short description", type: "textarea", full: true }} value={p.description} onChange={set("description")} />
          <Field f={{ name: "details", label: "Details (one bullet per line)", type: "textarea", full: true, help: "e.g. Upper material, sole, fit notes." }} value={p.details} onChange={set("details")} />
          <Field f={{ name: "active", label: "Visible in the store", type: "checkbox" }} value={p.active} onChange={set("active")} />
        </div>
      </div>
      <div className="panel"><h2 style={{ marginTop: 0 }}>Images</h2>
        <p className="hint mut" style={{ marginBottom: 12, fontSize: 12 }}>First image is the main one (transparent PNG, about 1200×1200, shoe centred). Add more angles after it.</p>
        <div className="gallery-adm">
          {p.images.map((src, i) => <div className="g" key={src + i}><img src={src} alt="" />{i === 0 && <em>MAIN</em>}<button className="x" onClick={() => setP((x) => ({ ...x, images: x.images.filter((_, k) => k !== i) }))} aria-label="Remove image">×</button>{i > 0 && <button className="l" onClick={() => move(i, -1)} aria-label="Move earlier">←</button>}</div>)}
          <label className="abtn ghost" style={{ height: 96, width: 96, justifyContent: "center", cursor: "pointer" }}>{up ? "…" : "+ Add"}<input type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={addImages} /></label>
        </div>
      </div>
      <div className="panel"><h2 style={{ marginTop: 0 }}>Tags &amp; colours</h2>
        <span className="lbl">Tags (labels on the product)</span>
        <div className="chips" style={{ marginBottom: 18 }}>{tags.map((t) => <label key={t.slug} className={"chipsel" + (p.tags.includes(t.slug) ? " on" : "")}><input type="checkbox" checked={p.tags.includes(t.slug)} onChange={() => toggle("tags", t.slug)} /><span className="pill" style={{ background: t.bg, color: t.fg }}>{t.name}</span></label>)}{!tags.length && <span className="mut">No tags yet. Create them under Tags.</span>}</div>
        <span className="lbl">Colours available</span>
        <div className="chips">{colors.map((c) => <label key={c.slug} className={"chipsel" + (p.colors.includes(c.slug) ? " on" : "")}><input type="checkbox" checked={p.colors.includes(c.slug)} onChange={() => toggle("colors", c.slug)} /><span className="sw" style={{ background: c.hex }} />{c.name}</label>)}</div>
      </div>
      <div className="panel"><h2 style={{ marginTop: 0 }}>Stock by UK size</h2>
        <p className="mut" style={{ fontSize: 12, marginBottom: 12 }}>Enter pairs in stock. 0 shows the size as sold out. Stock reduces automatically after each paid order.</p>
        <div className="sizes-adm">{sizeKeys.map((s) => <div key={s}><label>UK {s}</label><input className="in" type="number" min="0" value={p.sizes[s] ?? 0} onChange={(e) => setP((x) => ({ ...x, sizes: { ...x.sizes, [s]: e.target.value } }))} /></div>)}</div>
      </div>
      {msg && <p className={"flash" + (msg.err ? " err" : "")}>{msg.err || msg.ok}</p>}
      <div className="bar-actions">
        <button className="abtn" disabled={pending} onClick={save}>{pending ? "Saving…" : isNew ? "Create product" : "Save product"}</button>
        <a className="abtn ghost" href="/admin/products">Cancel</a>
        {!isNew && <button className="abtn danger" style={{ marginLeft: "auto" }} onClick={() => confirm("Delete this product permanently?") && start(async () => { const r = await deleteProduct(product.id); if (r.error) setMsg({ err: r.error }); else { router.push("/admin/products"); router.refresh(); } })}>Delete</button>}
      </div>
    </div>
  );
}
