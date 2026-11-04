"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrder } from "@/lib/actions/admin";
import { Field } from "./Fields";
import { STATUS } from "@/lib/format";

export default function OrderControls({ order }) {
  const [o, setO] = useState({ status: order.status, courier: order.courier || "", tracking_number: order.tracking_number || "", tracking_url: order.tracking_url || "", notes: order.notes || "" });
  const [msg, setMsg] = useState(null), [pending, start] = useTransition(), router = useRouter();
  const s = (k) => (v) => setO((x) => ({ ...x, [k]: v }));
  return (
    <div className="panel"><h2 style={{ marginTop: 0 }}>Fulfilment</h2>
      <div className="af">
        <Field f={{ name: "status", label: "Status", type: "select", options: Object.entries(STATUS) }} value={o.status} onChange={s("status")} />
        <Field f={{ name: "courier", label: "Courier", type: "text" }} value={o.courier} onChange={s("courier")} />
        <Field f={{ name: "tracking_number", label: "Tracking number", type: "text" }} value={o.tracking_number} onChange={s("tracking_number")} />
        <Field f={{ name: "tracking_url", label: "Tracking link (optional)", type: "text" }} value={o.tracking_url} onChange={s("tracking_url")} />
        <Field f={{ name: "notes", label: "Internal notes", type: "textarea", full: true }} value={o.notes} onChange={s("notes")} />
      </div>
      <p className="mut" style={{ fontSize: 12, marginTop: 10 }}>Setting the status to “Shipped” emails the customer their tracking details.</p>
      <div className="bar-actions" style={{ marginTop: 14 }}>
        <button className="abtn" disabled={pending} onClick={() => start(async () => { const r = await updateOrder(order.id, o); setMsg(r.error ? { err: r.error } : { ok: "Saved" }); router.refresh(); })}>{pending ? "Saving…" : "Save"}</button>
        {msg && <span className={"flash" + (msg.err ? " err" : "")} style={{ margin: 0 }}>{msg.err || msg.ok}</span>}
      </div>
    </div>
  );
}
