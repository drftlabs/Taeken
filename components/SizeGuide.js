"use client";
import { useEffect, useState } from "react";

// Approximate conversions: fit varies by style, so the note tells people to size up when between sizes.
const ROWS = [["6", "39", "7", "24.6"], ["7", "40.5", "8", "25.4"], ["8", "42", "9", "26.2"], ["9", "43", "10", "27.1"], ["10", "44.5", "11", "27.9"], ["11", "46", "12", "28.8"]];
export default function SizeGuide() {
  const [open, setOpen] = useState(false);
  useEffect(() => { if (!open) return; const e = (ev) => ev.key === "Escape" && setOpen(false); addEventListener("keydown", e); document.body.style.overflow = "hidden"; return () => { removeEventListener("keydown", e); document.body.style.overflow = ""; }; }, [open]);
  return (
    <>
      <button type="button" className="sg-link" onClick={() => setOpen(true)}>Size guide</button>
      {open && (
        <div className="qc sg" role="dialog" aria-modal="true" aria-label="Size guide">
          <div className="qc-scrim" onClick={() => setOpen(false)} />
          <div className="qc-panel narrow">
            <div className="qc-head"><b>Size guide</b><button className="ib" aria-label="Close" onClick={() => setOpen(false)}><svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5 5 19" /></svg></button></div>
            <div className="qc-body">
              <table className="sg-t"><thead><tr><th>UK</th><th>EU</th><th>US (M)</th><th>Foot length (cm)</th></tr></thead><tbody>{ROWS.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody></table>
              <h3 className="sg-h">How to measure</h3>
              <ol className="sg-l"><li>Stand on a sheet of paper against a wall, heel touching the wall.</li><li>Mark the tip of your longest toe and measure from the wall to the mark.</li><li>Match that length to the table. Between two sizes? Go up one.</li></ol>
              <p className="sg-n">Approximate chart. Fit can vary slightly by style, and you can exchange your size within our exchange window.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
