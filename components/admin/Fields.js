"use client";
import { useRef, useState } from "react";
import { browserClient } from "@/lib/supabase/client";

// Shrinks big photos in the browser (max 1600px, WebP keeps transparency) so pages load fast. SVG/GIF are uploaded as-is.
async function shrink(file) {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 350 * 1024) return file;
    const c = document.createElement("canvas"); c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise((r) => c.toBlob(r, "image/webp", 0.88));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" });
  } catch { return file; }
}
export async function uploadImage(orig, folder = "misc") {
  const file = await shrink(orig);
  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const { error } = await browserClient().storage.from("media").upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
  if (error) throw new Error(error.message);
  return browserClient().storage.from("media").getPublicUrl(path).data.publicUrl;
}

export function ImageField({ value, onChange, folder, hint }) {
  const ref = useRef(), [busy, setBusy] = useState(false), [err, setErr] = useState("");
  async function pick(e) {
    const f = e.target.files?.[0]; if (!f) return; setBusy(true); setErr("");
    try { onChange(await uploadImage(f, folder)); } catch (x) { setErr(x.message); }
    setBusy(false); e.target.value = "";
  }
  return (
    <div>
      <div className="imgup">
        <div className="pv">{value ? <img src={value} alt="" /> : <span>No image</span>}</div>
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="abtn sm" disabled={busy} onClick={() => ref.current.click()}>{busy ? "Uploading…" : value ? "Replace" : "Upload"}</button>
            {value && <button type="button" className="abtn sm ghost" onClick={() => onChange("")}>Remove</button>}
          </div>
          <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp,image/avif" hidden onChange={pick} />
        </div>
      </div>
      {hint && <p className="hint">{hint}</p>}{err && <p className="hint" style={{ color: "#ff8a8a" }}>{err}</p>}
    </div>
  );
}

export function Field({ f, value, onChange }) {
  const id = "f-" + f.name;
  const v = value ?? (f.type === "checkbox" ? false : "");
  if (f.type === "checkbox") return <label className="chk" key={f.name}><input type="checkbox" checked={!!v} onChange={(e) => onChange(e.target.checked)} />{f.label}</label>;
  return (
    <div className={f.full ? "full" : ""}>
      <label htmlFor={id}>{f.label}</label>
      {f.type === "textarea" ? <textarea id={id} value={v} onChange={(e) => onChange(e.target.value)} />
        : f.type === "select" ? <select id={id} value={v} onChange={(e) => onChange(e.target.value)}>{f.options.map(([val, l]) => <option key={val} value={val}>{l}</option>)}</select>
        : f.type === "color" ? <div className="colorin"><input type="color" value={/^#[0-9a-f]{6}$/i.test(v) ? v : "#000000"} onChange={(e) => onChange(e.target.value.toUpperCase())} aria-label={f.label + " picker"} /><input id={id} type="text" className="in" value={v} onChange={(e) => onChange(e.target.value)} maxLength={7} /></div>
        : f.type === "image" ? <ImageField value={v} onChange={onChange} folder={f.folder} hint={f.hint} />
        : <input id={id} type={f.type === "number" ? "number" : "text"} value={v} onChange={(e) => onChange(f.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)} />}
      {f.help && f.type !== "image" && <p className="hint">{f.help}</p>}
    </div>
  );
}
