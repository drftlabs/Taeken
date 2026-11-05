import Link from "next/link";
import DM from "./DM";
import Reveal from "./Reveal";

// Four brand points: where Taeken comes from (no prices / policies here, those live elsewhere).
const items = [
  { k: "街", t: "Born on the street", d: "Built from Indian street culture: music, movement and the way a city looks at 2 a.m." },
  { k: "闘", t: "Kung fu discipline", d: "Japanese street-fighter attitude and martial-arts sharpness in every line and panel." },
  { k: "走", t: "Street-racing speed", d: "Low, aggressive shapes and racing marks borrowed from night runs and the tuner scene." },
  { k: "魂", t: "Make your mark", d: "For Gen Z who refuse to blend in. Bold power on the feet, and a mark that's yours." },
];

export default function WhyTaeken() {
  return (
    <section className="sec why" aria-label="Why Taeken">
      <div className="wrap">
        <div className="sec-head">
          <div><p className="eyebrow">The Taeken difference</p><h2 className="h2">Why <em>Taeken?</em></h2></div>
          <span className="note"><DM n={3} /> 04 reasons</span>
        </div>
        <ul className="why-grid">
          {items.map((x, n) => (
            <Reveal as="li" key={x.t} delay={n * 70}>
              <span className="why-k" aria-hidden="true">{x.k}</span>
              <span className="why-n">0{n + 1}</span>
              <h3>{x.t}</h3><p>{x.d}</p>
            </Reveal>
          ))}
        </ul>
        <div className="why-cta"><Link className="btn" href="/collections/all">Shop the drop<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></Link></div>
      </div>
    </section>
  );
}
