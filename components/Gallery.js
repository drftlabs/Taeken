"use client";
import { useState } from "react";

export default function Gallery({ images, name }) {
  const [i, setI] = useState(0);
  return (
    <div className="gal">
      <div className="gal-main">{images[i] ? <img src={images[i]} alt={`${name}, view ${i + 1}`} /> : <span className="corners" />}</div>
      {images.length > 1 && <div className="thumbs">{images.map((src, k) => <button key={k} className={k === i ? "on" : ""} aria-label={`Show image ${k + 1}`} onClick={() => setI(k)}><img src={src} alt="" /></button>)}</div>}
    </div>
  );
}
