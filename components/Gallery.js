"use client";
import { useEffect, useRef, useState } from "react";
import Lightbox from "./Lightbox";

// Product photos: auto-slides every 5s, loops forever in one direction, slow glide.
// Pauses while someone is holding / hovering the photo or has the full-screen viewer open.
export default function Gallery({ images, name, kanji = ["闘", "走"] }) {
  const n = images.length, loop = n > 1;
  const slides = loop ? [...images, images[0]] : images;
  const [pos, setPos] = useState(0), [anim, setAnim] = useState(true), [hold, setHold] = useState(false), [hover, setHover] = useState(false);
  const [box, setBox] = useState(false), [zoom, setZoom] = useState(false), [org, setOrg] = useState("50% 50%");
  const x0 = useRef(null);
  const [k1, k2] = Array.isArray(kanji) ? kanji : [kanji, kanji];
  const cur = pos % n;

  const next = () => { if (!loop) return; setAnim(true); setPos((p) => (p >= n ? p : p + 1)); };
  const prev = () => {
    if (!loop) return;
    if (pos === 0) { setAnim(false); setPos(n); setTimeout(() => { setAnim(true); setPos(n - 1); }, 60); } else { setAnim(true); setPos(pos - 1); }
  };
  const to = (k) => { setAnim(true); setPos(k); };
  const ended = () => { if (pos === n) { setAnim(false); setPos(0); } };       // slid onto the clone of image 1: jump back silently
  useEffect(() => { if (anim) return; const id = requestAnimationFrame(() => requestAnimationFrame(() => setAnim(true))); return () => cancelAnimationFrame(id); }, [anim]);
  useEffect(() => { if (!loop || hold || hover || box) return; const t = setInterval(next, 5000); return () => clearInterval(t); }, [loop, hold, hover, box, pos]); // eslint-disable-line

  const move = (e) => { const r = e.currentTarget.getBoundingClientRect(); setOrg(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`); };
  const swipe = { onTouchStart: (e) => { x0.current = e.touches[0].clientX; }, onTouchEnd: (e) => { if (x0.current == null || !loop) return; const d = e.changedTouches[0].clientX - x0.current; if (Math.abs(d) > 45) (d < 0 ? next : prev)(); x0.current = null; } };
  const holdProps = { onPointerDown: () => setHold(true), onPointerUp: () => setHold(false), onPointerCancel: () => setHold(false), onPointerLeave: () => { setHold(false); setHover(false); }, onPointerEnter: (e) => e.pointerType === "mouse" && setHover(true) };

  return (
    <div className="gal">
      <div className="gal-main" {...swipe} {...holdProps}>
        <span className="gal-kanji k1" aria-hidden="true">{k1}</span><span className="gal-kanji k2" aria-hidden="true">{k2}</span>
        {n ? (
          <div className="gal-track" style={{ transform: `translateX(-${pos * 100}%)`, transition: anim ? "transform 1.1s cubic-bezier(.65,0,.35,1)" : "none" }} onTransitionEnd={ended}>
            {slides.map((src, k) => (
              <div className="gal-slide" key={k} aria-hidden={k % n !== cur}>
                <button className="gal-zoom" onMouseMove={move} onClick={() => { setZoom(false); setBox(true); }} aria-label="Open photo full screen"><img src={src} alt={`${name}, view ${(k % n) + 1}`} style={{ transformOrigin: org }} fetchPriority={k === 0 ? "high" : undefined} decoding="async" draggable="false" /></button>
              </div>
            ))}
          </div>
        ) : <span className="corners" />}
        {n > 0 && <button className="gal-zbtn" aria-label="Zoom photo" onClick={() => { setZoom(true); setBox(true); }}><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2M11 8v6M8 11h6" /></svg><span>Zoom</span></button>}
        {loop && <div className="gal-dots" aria-hidden="true">{images.map((_, k) => <i key={k} className={k === cur ? "on" : ""} />)}</div>}
      </div>
      {loop && <div className="thumbs">{images.map((src, k) => <button key={k} className={k === cur ? "on" : ""} aria-label={`Show image ${k + 1}`} onClick={() => to(k)}><img src={src} alt="" loading="lazy" decoding="async" /></button>)}</div>}
      {box && <Lightbox images={images} index={cur} name={name} startZoom={zoom} onClose={() => setBox(false)} onIndex={(k) => setPos(k)} />}
    </div>
  );
}
