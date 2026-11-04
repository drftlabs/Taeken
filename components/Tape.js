// Slanted street-tape marquee used as a divider between sections. Pure CSS animation, decorative.
const WORDS = ["街 STREET", "闘 FIGHT", "走 RACE", "TAEKEN", "型 SHAPE", "MAKE YOUR MARK", "速 SPEED", "魂 SOUL"];
export default function Tape({ light = false }) {
  const row = [...WORDS, ...WORDS];
  return (
    <div className="tapewrap" aria-hidden="true"><div className={"tapeband" + (light ? " light" : "")}>
      <div className="tb-in">{[0, 1].map((k) => <span key={k}>{row.map((w, i) => <b key={i}>{w}<i /></b>)}</span>)}</div>
    </div></div>
  );
}
