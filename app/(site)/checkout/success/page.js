import Link from "next/link";
import ClearCart from "@/components/ClearCart";
import { Arrow } from "@/components/Media";
export const metadata = { title: "Order confirmed", robots: { index: false } };
export default function Success({ searchParams }) {
  const o = String(searchParams.o || "").replace(/[^A-Za-z0-9-]/g, "").slice(0, 20);
  return (
    <div className="page"><ClearCart /><div className="center">
      <span className="stamp" aria-hidden="true" style={{ marginBottom: 24 }}>決</span>
      <h1 className="page-title">Order <em>confirmed</em></h1>
      <p className="lead">{o ? <>Your order number is <b style={{ color: "var(--chalk)" }}>{o}</b>. </> : null}A confirmation is on its way to your email. We create your account from that email, so you can log in with a one-time code to see your order and tracking.</p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}><Link className="btn" href="/account">View my orders <Arrow /></Link><Link className="btn ghost" href="/collections/all">Keep shopping</Link></div>
    </div></div>
  );
}
