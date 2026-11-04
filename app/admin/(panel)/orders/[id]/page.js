import Link from "next/link";
import { notFound } from "next/navigation";
import { serviceClient } from "@/lib/supabase/server";
import OrderControls from "@/components/admin/OrderControls";
import { inr, dateFmt, STATUS } from "@/lib/format";

export default async function OrderPage({ params }) {
  const { data: o } = await serviceClient().from("orders").select("*").eq("id", params.id).maybeSingle();
  if (!o) notFound();
  const a = o.shipping_address || {};
  return (
    <>
      <p className="mut"><Link href="/admin/orders">← Orders</Link></p>
      <h1>{o.order_number} <span className="pill" style={{ background: "#26262a", fontSize: 11 }}>{STATUS[o.status]}</span></h1>
      <p className="sub">Placed {dateFmt(o.created_at)}{o.paid_at && <> · Paid {dateFmt(o.paid_at)}</>}</p>
      <div className="af" style={{ alignItems: "start" }}>
        <div className="panel"><h2 style={{ marginTop: 0 }}>Customer</h2><p><b>{o.name}</b><br />{o.email}<br />{o.phone}</p><h2>Ship to</h2><p>{a.line1}<br />{a.line2 && <>{a.line2}<br /></>}{a.area && <>{a.area}<br /></>}{a.city}, {a.state} {a.pin}</p></div>
        <div className="panel"><h2 style={{ marginTop: 0 }}>Payment</h2>{o.payment_method === "cod" && <p className="flash" style={{ borderColor: "#ffb86b", background: "#2a2316", color: "#ffd08a" }}><b>COD order.</b> Paid online {inr(o.amount_paid)} · {o.amount_due > 0 ? <>courier collects <b>{inr(o.amount_due)}</b> in cash</> : "cash collected"}</p>}<p>Razorpay payment: <b>{o.razorpay_payment_id || "-"}</b><br />Razorpay order: <span className="mut">{o.razorpay_order_id || "-"}</span></p>
          <p style={{ marginTop: 12 }}>Subtotal {inr(o.subtotal)}<br />{o.discount > 0 && <>Discount {o.discount_code && `(${o.discount_code})`} −{inr(o.discount)}<br /></>}{o.payment_method === "cod" ? "COD delivery fee" : "Shipping"} {o.shipping ? inr(o.shipping) : "Free"}<br /><b style={{ fontSize: 18 }}>Total {inr(o.total)}</b></p></div>
      </div>
      <h2>Items</h2>
      <div className="tblwrap"><table className="tbl"><thead><tr><th></th><th>Product</th><th>UK size</th><th>Qty</th><th>Price</th></tr></thead><tbody>
        {o.items.map((i, k) => <tr key={k}><td><div className="thumbs-adm">{i.image && <img src={i.image} alt="" />}</div></td><td>{i.name}</td><td>{i.size}</td><td>{i.qty}</td><td>{inr(i.price * i.qty)}</td></tr>)}
      </tbody></table></div>
      <OrderControls order={o} />
    </>
  );
}
