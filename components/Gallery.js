"use client";
import { useEffect, useRef, useState } from "react";

// Product photos: hover-zoom on desktop, swipe on phones, full-screen viewer on tap/click.
export default function Gallery({ images, name }) {
  const [i, setI] = useState(0), [box, setBox] = useState(false), [pos, setPos] = useState("50% 50%");
  const n = images.length, x0 = useRef(null);
  const go = (d) => setI((v) => (v + d + n) % n);
  useEffect(() => {
    if (!box) return; document.body.style.overflow = "hidden";
    const k = (e) => { if (e.key === "Escape") setBox(false); if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); };
    addEventListener("keydown", k); return () => { removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [box, n]); // eslint-disable-line
  const move = (e) => { const r = e.currentTarget.getBoundingClientRect(); setPos(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`); };
  const touch = { onTouchStart: (e) => { x0.current = e.touches[0].clientX; }, onTouchEnd: (e) => { if (x0.current == null || n < 2) return; const d = e.changedTouches[0].clientX - x0.current; if (Math.abs(d) > 45) go(d < 0 ? 1 : -1); x0.current = null; } };
  return (
    <div className="gal">
      <div className="gal-main" {...touch}>
        <span className="gal-kanji" aria-hidden="true">闘</span>
        {images[i] ? <button className="gal-zoom" onMouseMove={move} onClick={() => setBox(true)} aria-label="Open full-screen photo"><img src={images[i]} alt={`${name}, view ${i + 1}`} style={{ transformOrigin: pos }} fetchPriority={i === 0 ? "high" : undefined} decoding="async" /></button> : <span className="corners" />}
        <span className="gal-hint" aria-hidden="true">⤢ Tap to zoom</span>
        {n > 1 && <div className="gal-dots" aria-hidden="true">{images.map((_, k) => <i key={k} className={k === i ? "on" : ""} />)}</div>}
      </div>
      {n > 1 && <div className="thumbs">{images.map((src, k) => <button key={k} className={k === i ? "on" : ""} aria-label={`Show image ${k + 1}`} onClick={() => setI(k)}><img src={src} alt="" loading="lazy" decoding="async" /></button>)}</div>}
      {box && (
        <div className="lb" role="dialog" aria-modal="true" aria-label={`${name} photos`} onClick={() => setBox(false)} {...touch}>
          <button className="lb-x" aria-label="Close" onClick={() => setBox(false)}>×</button>
          {n > 1 && <button className="lb-n prev" aria-label="Previous photo" onClick={(e) => { e.stopPropagation(); go(-1); }}>‹</button>}
          <img src={images[i]} alt={`${name}, view ${i + 1}`} onClick={(e) => e.stopPropagation()} />
          {n > 1 && <button className="lb-n next" aria-label="Next photo" onClick={(e) => { e.stopPropagation(); go(1); }}>›</button>}
          <span className="lb-c">{i + 1} / {n}</span>
        </div>
      )}
    </div>
  );
}
