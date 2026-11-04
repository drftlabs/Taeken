import Link from "next/link";
import { serviceClient } from "@/lib/supabase/server";
import { inr, dateFmt, STATUS } from "@/lib/format";

export default async function Dashboard() {
  const sb = serviceClient();
  if (!sb) return <p className="flash err">SUPABASE_SERVICE_ROLE_KEY is not set.</p>;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [{ data: paid }, { data: recent }, { count: toShip }, { count: newMsg }, { data: prods }] = await Promise.all([
    sb.from("orders").select("total,paid_at,status").not("paid_at", "is", null).not("status", "in", "(cancelled,refunded)"),
    sb.from("orders").select("id,order_number,name,total,status,created_at").neq("status", "pending_payment").order("created_at", { ascending: false }).limit(8),
    sb.from("orders").select("id", { count: "exact", head: true }).in("status", ["paid", "processing"]),
    sb.from("messages").select("id", { count: "exact", head: true }).eq("status", "new"),
    sb.from("products").select("id,name,sizes,active"),
  ]);
  const revenue = (paid || []).reduce((t, o) => t + o.total, 0);
  const todayRev = (paid || []).filter((o) => new Date(o.paid_at) >= today).reduce((t, o) => t + o.total, 0);
  const low = (prods || []).filter((p) => p.active && Object.values(p.sizes || {}).reduce((t, n) => t + Number(n), 0) <= 5);
  return (
    <>
      <h1>Dashboard</h1><p className="sub">Your store at a glance.</p>
      <div className="cards">
        <div className="stat"><b>{inr(todayRev)}</b><span>Sales today</span></div>
        <div className="stat"><b>{inr(revenue)}</b><span>Total sales</span></div>
        <Link href="/admin/orders?status=paid" className="stat"><b>{toShip ?? 0}</b><span>Orders to ship</span></Link>
        <Link href="/admin/messages" className="stat"><b>{newMsg ?? 0}</b><span>New messages</span></Link>
      </div>
      <h2>Recent orders</h2>
      <div className="tblwrap"><table className="tbl"><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Placed</th></tr></thead><tbody>
        {(recent || []).map((o) => <tr key={o.id}><td><Link href={`/admin/orders/${o.id}`}><b>{o.order_number}</b></Link></td><td>{o.name}</td><td>{inr(o.total)}</td><td>{STATUS[o.status]}</td><td className="mut">{dateFmt(o.created_at)}</td></tr>)}
        {!recent?.length && <tr><td colSpan="5" className="mut">No orders yet.</td></tr>}
      </tbody></table></div>
      {low.length > 0 && <><h2>Low stock</h2><div className="panel">{low.map((p) => <div key={p.id}><Link href={`/admin/products/${p.id}`}>{p.name}</Link> <span className="mut">· {Object.values(p.sizes || {}).reduce((t, n) => t + Number(n), 0)} pairs left</span></div>)}</div></>}
    </>
  );
}
