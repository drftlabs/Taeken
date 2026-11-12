"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// WhatsApp confirmation box: sends a 4-digit code, auto-submits when the 4th digit is entered, then hands back a signed token.
export default function WhatsAppOtp({ phone, onVerified, onClose }) {
  const [digits, setDigits] = useState(["", "", "", ""]), [msg, setMsg] = useState(""), [state, setState] = useState("sending"), [wait, setWait] = useState(0), [ref, setRef] = useState(""), [test, setTest] = useState(""), [shake, setShake] = useState(false);
  const refs = [useRef(), useRef(), useRef(), useRef()], busy = useRef(false), started = useRef(false);
  const pretty = "+91 " + String(phone).replace(/\D/g, "").slice(-10).replace(/(\d{5})(\d{5})/, "$1 $2");

  async function send() {
    setState("sending"); setMsg(""); setDigits(["", "", "", ""]);
    try {
      const r = await fetch("/api/otp/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) });
      const j = await r.json(); if (!r.ok) { setState("error"); setMsg(j.error || "Could not send the code."); setRef(j.ref || ""); return; }
      setTest(j.testCode || ""); setState("ready"); setWait(30); setTimeout(() => refs[0].current?.focus(), 80);
    } catch { setState("error"); setMsg("Network problem. Please try again."); }
  }
  useEffect(() => { if (!started.current) { started.current = true; send(); } }, []); // eslint-disable-line
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait(wait - 1), 1000); return () => clearTimeout(t); }, [wait]);
  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);

  async function verify(code) {
    if (busy.current) return; busy.current = true; setState("checking"); setMsg("");
    try {
      const r = await fetch("/api/otp/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, code }) });
      const j = await r.json();
      if (!r.ok) { setState("ready"); setMsg(j.error || "Wrong code."); setShake(true); setTimeout(() => setShake(false), 500); setDigits(["", "", "", ""]); setTimeout(() => refs[0].current?.focus(), 60); busy.current = false; return; }
      setState("verified"); setTimeout(() => onVerified(j.token), 900);
    } catch { setState("ready"); setMsg("Network problem. Please try again."); busy.current = false; }
  }
  const fill = (arr) => { setDigits(arr); if (arr.every(Boolean)) verify(arr.join("")); };
  const onChange = (i, v) => {
    const d = v.replace(/\D/g, ""); if (!d) { const a = [...digits]; a[i] = ""; setDigits(a); return; }
    if (d.length > 1) { const a = d.slice(0, 4).split("").concat(["", "", "", ""]).slice(0, 4); fill(a); refs[Math.min(3, d.length - 1)].current?.focus(); return; }   // pasted / autofilled whole code
    const a = [...digits]; a[i] = d; if (i < 3) refs[i + 1].current?.focus(); fill(a);
  };
  const onKey = (i, e) => { if (e.key === "Backspace" && !digits[i] && i > 0) refs[i - 1].current?.focus(); };
  const paste = async () => { try { const t = (await navigator.clipboard.readText()).replace(/\D/g, "").slice(0, 4); if (t.length === 4) fill(t.split("")); else setMsg("Copy the 4-digit code from WhatsApp first."); } catch { setMsg("Long-press a box and choose Paste."); } };

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="otp" role="dialog" aria-modal="true" aria-label="WhatsApp confirmation">
      <div className="otp-scrim" onClick={state === "verified" ? undefined : onClose} />
      <div className="otp-box">
        {state === "verified" ? (
          <div className="otp-ok"><span className="tick"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span><b>WhatsApp verified</b><small>Placing your order…</small></div>
        ) : (
          <>
            <button className="otp-x" aria-label="Close" onClick={onClose}><svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19" /></svg></button>
            <span className="otp-wa" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z" /><path d="M8.7 8.4c.3 2.6 2.6 5.3 6 6.3l1.3-1.4-1.9-1-.9.7c-.9-.4-1.8-1.3-2.2-2.2l.7-.9-1-1.9z" fill="currentColor" stroke="none" /></svg></span>
            <h2>WhatsApp confirmation</h2>
            {state === "sending" && <p className="otp-sub">Sending a code to WhatsApp {pretty}…</p>}
            {state === "error" && <><p className="otp-sub bad">{msg}</p>{ref && <p className="otp-sub" style={{ fontSize: 11, opacity: .6 }}>Reference: {ref}</p>}</>}
            {(state === "ready" || state === "checking") && <p className="otp-sub">We sent a 4-digit code to WhatsApp <b>{pretty}</b>. Enter it to place your order.</p>}
            {test && <p className="otp-test">Test mode: your code is <b>{test}</b></p>}
            <div className={"otp-in" + (shake ? " shake" : "")}>
              {digits.map((d, i) => <input key={i} ref={refs[i]} value={d} inputMode="numeric" pattern="[0-9]*" maxLength={i === 0 ? 4 : 1} autoComplete={i === 0 ? "one-time-code" : "off"} aria-label={`Digit ${i + 1}`} disabled={state !== "ready"} onChange={(e) => onChange(i, e.target.value)} onKeyDown={(e) => onKey(i, e)} onFocus={(e) => e.target.select()} />)}
            </div>
            {state === "checking" && <p className="otp-sub">Checking…</p>}
            {state === "ready" && msg && <p className="otp-sub bad">{msg}</p>}
            <div className="otp-row">
              <button type="button" className="otp-link" onClick={paste} disabled={state !== "ready"}>Paste code</button>
              <button type="button" className="otp-link" onClick={send} disabled={wait > 0 || state === "sending" || state === "checking"}>{wait > 0 ? `Resend in ${wait}s` : "Resend code"}</button>
            </div>
            <p className="otp-foot">Wrong number? <button type="button" className="otp-link" onClick={onClose}>Edit it</button>. No need to tap submit, it places the order as soon as the 4th digit is in.</p>
          </>
        )}
      </div>
    </div>, document.body);
}
