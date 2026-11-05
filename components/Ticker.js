function Set({ items, hidden }) {
  return (
    <div className="tk-set" aria-hidden={hidden || undefined}>
      {[0, 1, 2].map((n) => items.map((t, i) => <span key={`${n}-${i}`} style={{ display: "contents" }}><span>{t}</span><i /></span>))}
    </div>
  );
}
// Always-on announcement strip (edit lines in Admin → Settings)
import { inr } from "@/lib/format";
export default function Ticker({ items, freeMin }) {
  let list = items?.length ? items : ["Make your mark"];
  // the free-shipping line always follows the Settings value, so it can never be out of date
  if (Number(freeMin) > 0) list = list.map((t) => (/free shipping/i.test(t) ? t.replace(/₹\s?[\d,]+/, inr(freeMin)) : t));
  return (
    <div className="ticker" aria-label="Announcements"><div className="tk-track"><Set items={list} /><Set items={list} hidden /></div></div>
  );
}
