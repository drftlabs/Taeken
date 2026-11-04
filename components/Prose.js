// Tiny renderer for policy text: "## Heading", "- bullet", blank-line paragraphs, **bold**.
const inline = (t) => t.split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : p));
export default function Prose({ text }) {
  const out = []; let list = [], para = [];
  const flushP = () => { if (para.length) { out.push(<p key={out.length}>{para.map((l, i) => <span key={i}>{inline(l)}{i < para.length - 1 && <br />}</span>)}</p>); para = []; } };
  const flushL = () => { if (list.length) { out.push(<ul key={out.length}>{list.map((l, i) => <li key={i}>{inline(l)}</li>)}</ul>); list = []; } };
  for (const raw of String(text).split("\n")) {
    const l = raw.trim();
    if (!l) { flushP(); flushL(); }
    else if (l.startsWith("## ")) { flushP(); flushL(); out.push(<h2 key={out.length}>{l.slice(3)}</h2>); }
    else if (l.startsWith("- ")) { flushP(); list.push(l.slice(2)); }
    else if (/^\d+\.\s/.test(l)) { flushP(); list.push(l.replace(/^\d+\.\s/, "")); }
    else { flushL(); para.push(l); }
  }
  flushP(); flushL();
  return <div className="prose">{out}</div>;
}
