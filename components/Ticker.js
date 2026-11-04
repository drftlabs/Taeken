function Set({ items, hidden }) {
  return (
    <div className="tk-set" aria-hidden={hidden || undefined}>
      {[0, 1, 2].map((n) => items.map((t, i) => <span key={`${n}-${i}`} style={{ display: "contents" }}><span>{t}</span><i /></span>))}
    </div>
  );
}
// Always-on announcement strip (edit lines in Admin → Settings)
export default function Ticker({ items }) {
  const list = items?.length ? items : ["Make your mark"];
  return (
    <div className="ticker" aria-label="Announcements"><div className="tk-track"><Set items={list} /><Set items={list} hidden /></div></div>
  );
}
