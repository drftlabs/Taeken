"use client";
import { useState, useTransition } from "react";
import { testWhatsApp } from "@/lib/actions/whatsapp";

export default function WhatsAppTest() {
  const [phone, setPhone] = useState(""), [res, setRes] = useState(null), [pending, start] = useTransition();
  const run = (p) => start(async () => { try { setRes(await testWhatsApp(p)); } catch (e) { setRes({ error: { message: e.message } }); } });
  const row = (k, v, bad) => <tr key={k}><td className="mut" style={{ width: 200 }}>{k}</td><td style={bad ? { color: "#ff9a9a" } : null}>{v}</td></tr>;
  return (
    <>
      <div className="panel">
        <p className="mut" style={{ margin: "0 0 12px", fontSize: 13 }}>Checks your WhatsApp settings step by step and shows the exact reply from Meta. <b>Step 1</b> only checks the settings. <b>Step 2</b> sends a real test message (code 1234) to the number you enter.</p>
        <div className="bar-actions">
          <button className="abtn" disabled={pending} onClick={() => run("")}>{pending ? "Checking…" : "1. Check settings"}</button>
          <input className="in" style={{ width: 200 }} inputMode="numeric" placeholder="10-digit mobile" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <button className="abtn ghost" disabled={pending || phone.replace(/\D/g, "").length < 10} onClick={() => run(phone)}>2. Send test code</button>
        </div>
      </div>
      {res?.error && !res.env && <p className="flash err">{res.error.message || res.error}</p>}
      {res?.env && (
        <div className="panel">
          <table className="kv"><tbody>
            {row("Access token", res.env.token, res.env.token === "MISSING")}
            {row("Phone number ID", res.env.phoneId, res.env.phoneId === "MISSING")}
            {row("Template name", res.env.template)}{row("Template language", res.env.lang)}{row("Test mode", res.env.testMode)}
            {res.phone && (res.phone.ok ? <>{row("Meta found the number", "Yes ✓")}{row("Number", res.phone.display_phone_number)}{row("Display name", res.phone.verified_name || "-")}{row("Mode", res.phone.account_mode || "-")}{row("Quality", res.phone.quality_rating || "-")}</> : row("Meta lookup", `✗ (#${res.phone.error?.code ?? "?"}) ${res.phone.error?.message || ""}`, true))}
            {res.send && row("Test message", res.send.ok ? `Accepted by Meta ✓ (${res.send.messageId || ""})` : `✗ (#${res.send.code ?? res.send.status ?? "?"}) ${res.send.message || ""} ${res.send.detail || ""}`, !res.send.ok)}
          </tbody></table>
          {res.warn && <p className="flash err">{res.warn}</p>}
          {res.testNumber && <p className="flash" style={{ borderColor: "#ffb86b", background: "#2a2316", color: "#ffd08a" }}>{res.testNumber}</p>}
          {res.advice && <p className={"flash" + (res.send?.ok === false || res.phone?.ok === false ? " err" : "")}><b>What to do:</b> {res.advice}</p>}
        </div>
      )}
    </>
  );
}
