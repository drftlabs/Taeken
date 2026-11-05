import Link from "next/link";
import DM from "./DM";
import Reveal from "./Reveal";
import { inr } from "@/lib/format";

const I = {
  design: <svg viewBox="0 0 24 24"><path d="M3 15c3 0 4-5 8-5 3 0 3 3 6 3l4 1v3H3z" /><path d="M8 18v-3" /></svg>,
  tag: <svg viewBox="0 0 24 24"><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1.4" /></svg>,
  ship: <svg viewBox="0 0 24 24"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="17" r="1.6" /><circle cx="17" cy="17" r="1.6" /></svg>,
  ret: <svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 14-5l2 2M20 12a8 8 0 0 1-14 5l-2-2M20 4v5h-5M4 20v-5h5" /></svg>,
  lock: <svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="1" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>,
};

// Short "why buy from us" block for the homepage. Numbers come from Settings so they never go stale.
export default function WhyTaeken({ cfg, settings }) {
  const items = [
    { k: "走", i: I.design, t: "Street-born design", d: "Distinctive silhouettes made for everyday wear, not for the shelf." },
    { k: "街", i: I.tag, t: "Priced to wear", d: "Honest pricing, mostly between ₹1,500 and ₹2,500. No hype tax." },
    { k: "速", i: I.ship, t: "Quick, tracked delivery", d: `Delivered in ${settings.delivery_days}. ${cfg.min > 0 ? `Free shipping above ${inr(cfg.min)}.` : ""}` },
    { k: "形", i: I.ret, t: `${cfg.returnDays}-day returns`, d: `Plus ${cfg.exchangeDays}-day size exchange. Fit wrong? We fix it.` },
    { k: "決", i: I.lock, t: "Pay your way", d: cfg.codEnabled ? `UPI, cards, netbanking, or cash on delivery with just ${cfg.codPct}% paid now.` : "UPI, cards and netbanking through Razorpay." },
  ];
  return (
    <section className="sec why" aria-label="Why Taeken">
      <div className="wrap">
        <div className="sec-head">
          <div><p className="eyebrow">The Taeken difference</p><h2 className="h2">Why <em>Taeken?</em></h2></div>
          <span className="note"><DM n={3} /> 05 reasons</span>
        </div>
        <ul className="why-grid">
          {items.map((x, n) => (
            <Reveal as="li" key={x.t} delay={n * 70}>
              <span className="why-k" aria-hidden="true">{x.k}</span>
              <span className="why-n">0{n + 1}</span>
              <span className="why-i">{x.i}</span>
              <h3>{x.t}</h3><p>{x.d}</p>
            </Reveal>
          ))}
        </ul>
        <div className="why-cta"><Link className="btn" href="/collections/all">Shop the drop<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></Link></div>
      </div>
    </section>
  );
}
