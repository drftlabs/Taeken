"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useShop } from "./ShopProvider";
import { inr, STATES } from "@/lib/format";
import { Arrow } from "./Media";

function loadRzp() {
  return new Promise((res, rej) => {
    if (window.Razorpay) return res();
    const s = document.createElement("script"); s.src = "https://checkout.razorpay.com/v1/checkout.js"; s.onload = res; s.onerror = () => rej(new Error("Could not load payment window")); document.body.appendChild(s);
  });
}

export default function CheckoutForm() {
  const { items, subtotal, ship, total, shipping, clear, email: loginEmail, ready } = useShop();
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", phone: "", line1: "", line2: "", city: "", state: "", pin: "" });
  const [busy, setBusy] = useState(false), [err, setErr] = useState("");
  useEffect(() => { if (loginEmail && !f.email) setF((x) => ({ ...x, email: loginEmail })); }, [loginEmail]); // eslint-disable-line
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  if (ready && !items.length) return <div className="center"><h1 className="page-title">Your bag is <em>empty</em></h1><p className="lead">Pick a pair first.</p><Link className="btn" href="/collections/all">Shop the collection <Arrow /></Link></div>;

  async function pay(e) {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      const r = await fetch("/api/checkout/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: items.map((i) => ({ id: i.id, size: i.size, qty: i.qty })), customer: { name: f.name, email: f.email, phone: f.phone }, address: { line1: f.line1, line2: f.line2, city: f.city, state: f.state, pin: f.pin } }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || "Could not start payment");
      await loadRzp();
      const rz = new window.Razorpay({
        key: d.key, amount: d.amount, currency: "INR", name: "Taeken", description: `Order ${d.orderNumber}`, order_id: d.rzpOrderId,
        prefill: { name: d.prefill.name, email: d.prefill.email, contact: d.prefill.phone }, theme: { color: "#D7262B" },
        modal: { ondismiss: () => { setBusy(false); setErr("Payment was not completed. Your bag is saved, so you can try again."); } },
        handler: async (resp) => {
          const v = await fetch("/api/checkout/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order_id: d.orderId, ...resp }) });
          const vd = await v.json();
          if (!v.ok) { setBusy(false); setErr((vd.error || "Verification failed") + " If money was deducted, it will be confirmed automatically or refunded. Contact us with order " + d.orderNumber + "."); return; }
          clear(); router.push(`/checkout/success?o=${encodeURIComponent(vd.orderNumber)}`);
        },
      });
      rz.on("payment.failed", (x) => { setBusy(false); setErr(x.error?.description || "Payment failed. Please try again."); });
      rz.open();
    } catch (x) { setErr(x.message); setBusy(false); }
  }

  return (
    <form className="co" onSubmit={pay}>
      <div>
        <h2>Contact</h2>
        <div className="form" style={{ maxWidth: "none" }}>
          <div className="field"><label htmlFor="name">Full name</label><input id="name" required autoComplete="name" value={f.name} onChange={set("name")} /></div>
          <div className="row">
            <div className="field"><label htmlFor="email">Email</label><input id="email" type="email" required autoComplete="email" value={f.email} onChange={set("email")} /><p className="hint">Your order updates and account login use this email.</p></div>
            <div className="field"><label htmlFor="phone">Phone</label><input id="phone" type="tel" required inputMode="tel" autoComplete="tel" pattern="[0-9+ ]{10,15}" value={f.phone} onChange={set("phone")} /></div>
          </div>
        </div>
        <h2>Delivery address</h2>
        <div className="form" style={{ maxWidth: "none" }}>
          <div className="field"><label htmlFor="l1">Address</label><input id="l1" required autoComplete="address-line1" value={f.line1} onChange={set("line1")} /></div>
          <div className="field"><label htmlFor="l2">Apartment, landmark (optional)</label><input id="l2" autoComplete="address-line2" value={f.line2} onChange={set("line2")} /></div>
          <div className="row">
            <div className="field"><label htmlFor="city">City</label><input id="city" required autoComplete="address-level2" value={f.city} onChange={set("city")} /></div>
            <div className="field"><label htmlFor="pin">Pin code</label><input id="pin" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="postal-code" value={f.pin} onChange={set("pin")} /></div>
          </div>
          <div className="field"><label htmlFor="state">State</label><select id="state" required value={f.state} onChange={set("state")}><option value="">Select state</option>{STATES.map((s) => <option key={s}>{s}</option>)}</select></div>
        </div>
      </div>
      <aside className="sum" aria-label="Order summary">
        <h2 style={{ margin: "0 0 8px" }}>Order summary</h2>
        {items.map((i) => (
          <div className="li" key={i.id + i.size}><div className="thumb">{i.image && <img src={i.image} alt={i.name} />}</div><div><h3>{i.name}</h3><small>UK {i.size} × {i.qty}</small></div><div className="pr">{inr(i.price * i.qty)}</div></div>
        ))}
        <div className="line" style={{ marginTop: 10 }}><span>Subtotal</span><span>{inr(subtotal)}</span></div>
        <div className="line"><span>Shipping</span><span>{ship ? inr(ship) : "Free"}</span></div>
        {ship > 0 && <div className="line" style={{ fontSize: 12 }}><span>Add {inr(shipping.min - subtotal)} more for free shipping</span><span /></div>}
        <div className="line tot"><span>Total</span><span>{inr(total)}</span></div>
        {err && <p className="msg-err" style={{ marginTop: 14 }} role="alert">{err}</p>}
        <button className="btn" type="submit" disabled={busy}>{busy ? "Opening payment…" : <>Pay {inr(total)} <Arrow /></>}</button>
        <p className="secure">Secure payment by Razorpay · UPI, cards, netbanking, wallets</p>
        <p className="secure" style={{ marginTop: 6 }}>By paying you agree to our <Link className="link" href="/policies/terms" style={{ fontSize: 12 }}>Terms</Link> and <Link className="link" href="/policies/returns" style={{ fontSize: 12 }}>Return Policy</Link>.</p>
      </aside>
    </form>
  );
}
