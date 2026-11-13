"use client";
import { useState, useTransition } from "react";
import { testWhatsApp, whatsappLog, subscribeApp } from "@/lib/actions/whatsapp";

export default function WhatsAppTest() {
  const [phone, setPhone] = useState(""), [res, setRes] = useState(null), [pending, start] = useTransition(), [log, setLog] = useState(null), [waba, setWaba] = useState(""), [sub, setSub] = useState(null);
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
      <div className="panel">
        <h2 style={{ marginTop: 0 }}>3. Delivery log</h2>
        <p className="mut" style={{ margin: "0 0 12px", fontSize: 13 }}>Meta accepting a message is not the same as it arriving. This log shows what Meta reports afterwards (sent, delivered, or the exact reason it failed). It fills in only after the webhook is connected (see WHATSAPP_SETUP.md, “Delivery log”).</p>
        <div className="bar-actions">
          <button className="abtn ghost" disabled={pending} onClick={() => start(async () => setLog(await whatsappLog()))}>Refresh delivery log</button>
          <input className="in" style={{ width: 230 }} inputMode="numeric" placeholder="WhatsApp Business Account ID" value={waba} onChange={(e) => setWaba(e.target.value)} />
          <button className="abtn ghost" disabled={pending || waba.replace(/\D/g, "").length < 8} onClick={() => start(async () => setSub(await subscribeApp(waba)))}>Connect webhook to this account</button>
        </div>
        {sub && <p className={"flash" + (sub.ok ? "" : " err")}>{sub.ok ? "Connected ✓. Meta will now report delivery results." : `${sub.error} ${sub.advice || ""}`}</p>}
        {log?.missing && <p className="flash err">Run <code>supabase/migration_8.sql</code> in Supabase → SQL Editor first.</p>}
        {log?.rows && (log.rows.length ? <div className="tblwrap"><table className="tbl compact"><thead><tr><th>Time</th><th>To</th><th>Status</th><th>Reason / what to do</th></tr></thead><tbody>{log.rows.map((r) => <tr key={r.id}><td className="mut">{new Date(r.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" })}</td><td>{r.recipient}</td><td><b style={{ color: r.status === "failed" ? "#ff9a9a" : r.status === "sent" ? "#9a9aa0" : "#7fe0a0" }}>{r.status}</b></td><td>{r.status === "failed" ? <>(#{r.code}) {r.title} {r.detail}<div className="mut" style={{ marginTop: 4 }}>{r.advice}</div></> : <span className="mut">-</span>}</td></tr>)}</tbody></table></div> : <p className="mut" style={{ margin: 0 }}>Nothing yet. Send a test code, wait a few seconds, then refresh.</p>)}
      </div>
      {res?.error && !res.env && <p className="flash err">{res.error.message || res.error}</p>}
      {res?.env && (
        <div className="panel">
          <table className="kv"><tbody>
            {row("Access token", res.env.token, res.env.token === "MISSING")}
            {row("Phone number ID", res.env.phoneId, res.env.phoneId === "MISSING")}
            {row("Template name", res.env.template)}{row("Template language", res.env.lang)}{row("Test mode", res.env.testMode)}
            {res.phone && (res.phone.ok ? <>{row("Meta found the number", "Yes ✓")}{row("Number", res.phone.display_phone_number)}{row("Display name", res.phone.verified_name || "-")}{row("Mode", res.phone.account_mode || "-")}{row("Quality", res.phone.quality_rating || "-")}{res.phone.name_status && row("Display name status", `${res.phone.name_status}${res.phone.new_name_status && res.phone.new_name_status !== "NONE" ? ` (change: ${res.phone.new_name_status})` : ""}`, res.phone.name_status !== "APPROVED")}</> : row("Meta lookup", `✗ (#${res.phone.error?.code ?? "?"}) ${res.phone.error?.message || ""}`, true))}
            {res.send && row("Test message", res.send.ok ? `Accepted by Meta ✓ (${res.send.messageId || ""})` : `✗ (#${res.send.code ?? res.send.status ?? "?"}) ${res.send.message || ""} ${res.send.detail || ""}`, !res.send.ok)}
          </tbody></table>
          {res.nameWarn && <p className="flash err">{res.nameWarn}</p>}
          {res.warn && <p className="flash err">{res.warn}</p>}
          {res.testNumber && <p className="flash" style={{ borderColor: "#ffb86b", background: "#2a2316", color: "#ffd08a" }}>{res.testNumber}</p>}
          {res.advice && <p className={"flash" + (res.send?.ok === false || res.phone?.ok === false ? " err" : "")}><b>What to do:</b> {res.advice}</p>}
        </div>
      )}
    </>
  );
}
