"use client";
import { useEffect, useRef, useState } from "react";
import { Media, SmartLink, Arrow, lines } from "./Media";

const GHOST = ["街", "闘", "速"];
const SECONDS = 6;

export default function Hero({ slides }) {
  const N = slides.length;
  const [cur, setCur] = useState(0);
  const [hover, setHover] = useState(false), [focus, setFocus] = useState(false), [off, setOff] = useState(false), [paused, setPaused] = useState(false);
  const [reduce, setReduce] = useState(false);
  const ref = useRef(), sx = useRef([0, 0]), swiped = useRef(false);
  const go = (n) => setCur((n + N) % N);
  const hold = hover || focus || off || paused;

  useEffect(() => { const m = matchMedia("(prefers-reduced-motion: reduce)"); setReduce(m.matches); if (m.matches) setPaused(true); }, []);
  useEffect(() => {
    const io = new IntersectionObserver((e) => setOff(!e[0].isIntersecting), { threshold: 0.25 });
    ref.current && io.observe(ref.current); return () => io.disconnect();
  }, []);
  if (!N) return null;
  return (
    <section ref={ref} className={"hero" + (hold ? " hold" : "") + (reduce ? " static" : "")} style={{ "--dur": SECONDS * 1000 + "ms" }}
      aria-roledescription="carousel" aria-label="Featured campaigns"
      onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)} onPointerLeave={() => setHover(false)}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      onKeyDown={(e) => { if (e.key === "ArrowRight") go(cur + 1); if (e.key === "ArrowLeft") go(cur - 1); }}
      onPointerDown={(e) => { sx.current = [e.clientX, e.clientY]; swiped.current = false; }}
      onPointerUp={(e) => { const dx = e.clientX - sx.current[0], dy = e.clientY - sx.current[1]; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { swiped.current = true; go(cur + (dx < 0 ? 1 : -1)); } }}
      onClickCapture={(e) => { if (swiped.current) { e.preventDefault(); e.stopPropagation(); swiped.current = false; } }}>
      <div className="slides">
        {slides.map((s, i) => {
          const H = i === 0 ? "h1" : "h2";
          return (
            <article key={s.id || i} className={"slide" + (i === cur ? " is-active" : "")} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${N}`} aria-hidden={i !== cur} inert={i === cur ? undefined : ""}>
              <Media src={s.image} mobile={s.image_mobile} alt={s.title?.replace("|", " ")} position={s.position} ghost={GHOST[i % 3]} tag={`IMG ${String(i + 1).padStart(2, "0")}`} />
              <div className="shade" />
              <div className="copy">
                <div className="kick"><span>{s.kicker}</span></div>
                <H className="hl">{lines(s.title)}</H>
                <SmartLink className="btn" href={s.link}>{s.cta_text}<Arrow /></SmartLink>
              </div>
            </article>
          );
        })}
      </div>
      <i className="reg tl" aria-hidden="true" />
      <span className="vert" aria-hidden="true">街闘速</span>
      <div className="hud">
        <div className="laps">
          {slides.map((s, i) => (
            <button key={i} className={"lap" + (i < cur ? " done" : "") + (i === cur ? " run" : "")} aria-label={`Go to slide ${i + 1}`} aria-current={i === cur} onClick={() => go(i)}>
              <span className="bar2"><i key={i === cur ? "run" + cur : "x" + i} onAnimationEnd={() => { if (i === cur && !reduce) go(cur + 1); }} /></span>
            </button>
          ))}
        </div>
      </div>
      <div className="checker" aria-hidden="true" />
    </section>
  );
}
