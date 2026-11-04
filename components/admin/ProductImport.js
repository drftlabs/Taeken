"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importProducts } from "@/lib/actions/admin";

export default function ProductImport() {
  const [text, setText] = useState(""), [name, setName] = useState(""), [res, setRes] = useState(null), [pending, start] = useTransition(), router = useRouter();
  return (
    <div className="panel">
      <p className="mut" style={{ fontSize: 13, marginBottom: 12 }}>Upload a CSV to add or update many products at once. Existing products are matched by <b>slug</b> or <b>SKU</b> and updated; new ones are created. Start from the template (it has your size columns). Tags, colours, collections and images are separated with <code>|</code>. Images must already be URLs (upload them in a product first, or use any public image link).</p>
      <div className="bar-actions">
        <a className="abtn ghost sm" href="/admin/products/export?template=1">⬇ Download template</a>
        <a className="abtn ghost sm" href="/admin/products/export">⬇ Export all products</a>
        <label className="abtn sm" style={{ cursor: "pointer" }}>Choose CSV file<input type="file" accept=".csv,text/csv" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) { setText(await f.text()); setName(f.name); setRes(null); } e.target.value = ""; }} /></label>
        {name && <span className="mut" style={{ fontSize: 12 }}>{name}</span>}
        {text && <button className="abtn sm" disabled={pending} onClick={() => start(async () => { setRes(await importProducts(text)); router.refresh(); })}>{pending ? "Importing…" : "Import now"}</button>}
      </div>
      {res && <div className={"flash" + (res.errors?.length && !res.created && !res.updated ? " err" : "")}>
        <b>{res.created} created · {res.updated} updated</b>
        {res.errors?.length > 0 && <ul style={{ margin: "8px 0 0 18px", fontSize: 12 }}>{res.errors.slice(0, 25).map((e, i) => <li key={i}>{e}</li>)}</ul>}
      </div>}
    </div>
  );
}
