import Link from "next/link";
import { serviceClient } from "@/lib/supabase/server";
import TrackingImport from "@/components/admin/TrackingImport";
import { inr, dateFmt, STATUS } from "@/lib/format";

const FILTERS = ["all", "paid", "processing", "shipped", "delivered", "cancelled", "refunded", "pending_payment"];
export default async function Orders({ searchParams }) {
  const status = FILTERS.includes(searchParams.status) ? searchParams.status : "all";
  const q = String(searchParams.q || "").trim();
  let query = serviceClient().from("orders").select("*").order("created_at", { ascending: false }).limit(200);
  if (status !== "all") query = query.eq("status", status); else query = query.neq("status", "pending_payment");
  if (q) query = query.or(`order_number.ilike.%${q.replace(/[%,()]/g, "")}%,email.ilike.%${q.replace(/[%,()]/g, "")}%,name.ilike.%${q.replace(/[%,()]/g, "")}%`);
  const { data: orders } = await query;
  return (
    <>
      <h1>Orders</h1><p className="sub">Export orders for your courier, then import tracking numbers back: customers are emailed automatically.</p>
      <div className="bar-actions">
        {FILTERS.map((f) => <Link key={f} className={"abtn sm " + (f === status ? "" : "ghost")} href={f === "all" ? "/admin/orders" : `/admin/orders?status=${f}`}>{f === "all" ? "All" : STATUS[f]}</Link>)}
      </div>
      <div className="bar-actions">
        <form style={{ display: "flex", gap: 8 }}><input className="in" style={{ width: 260 }} name="q" defaultValue={q} placeholder="Search order #, name, email" />{status !== "all" && <input type="hidden" name="status" value={status} />}<button className="abtn sm">Search</button></form>
        <a className="abtn sm ghost" href={`/admin/orders/export${status !== "all" ? `?status=${status}` : ""}`}>⬇ Export CSV</a>
      </div>
      <div className="tblwrap"><table className="tbl"><thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Tracking</th></tr></thead><tbody>
        {(orders || []).map((o) => <tr key={o.id}><td><Link href={`/admin/orders/${o.id}`}><b>{o.order_number}</b></Link></td><td className="mut">{dateFmt(o.created_at)}</td><td>{o.name}<br /><span className="mut">{o.email}</span></td><td>{(o.items || []).reduce((t, i) => t + i.qty, 0)}</td><td>{inr(o.total)}</td><td>{STATUS[o.status]}</td><td className="mut">{o.tracking_number || "-"}</td></tr>)}
        {!orders?.length && <tr><td colSpan="7" className="mut">No orders found.</td></tr>}
      </tbody></table></div>
      <h2>Bulk tracking</h2><TrackingImport />
    </>
  );
}
