import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabase/server";
import { normalizePhone, newCode, hashCode, sendWhatsAppCode } from "@/lib/otp";

export async function POST(req) {
  let b = {}; try { b = await req.json(); } catch {}
  const phone = normalizePhone(b.phone);
  if (!phone) return NextResponse.json({ error: "Enter a valid 10-digit mobile number." }, { status: 400 });
  const sb = serviceClient(); if (!sb) return NextResponse.json({ error: "The store backend isn't connected yet." }, { status: 503 });
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim().slice(0, 45);
  const now = Date.now(), iso = (ms) => new Date(now - ms).toISOString();

  const { data: recent, error: e1 } = await sb.from("otp_codes").select("created_at").eq("phone", phone).gte("created_at", iso(30 * 60 * 1000)).order("created_at", { ascending: false });
  if (e1) return NextResponse.json({ error: "Verification isn't set up yet (run migration_6.sql in Supabase)." }, { status: 500 });
  if (recent?.length && now - new Date(recent[0].created_at).getTime() < 25000) return NextResponse.json({ error: "Please wait a few seconds before asking for another code." }, { status: 429 });
  if ((recent?.length || 0) >= 4) return NextResponse.json({ error: "Too many codes requested for this number. Try again in 30 minutes." }, { status: 429 });
  if (ip) { const { count } = await sb.from("otp_codes").select("id", { count: "exact", head: true }).eq("ip", ip).gte("created_at", iso(60 * 60 * 1000)); if ((count || 0) >= 15) return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 }); }

  const test = process.env.OTP_TEST_MODE === "1";
  if (!test && (!process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_ID)) return NextResponse.json({ error: "WhatsApp confirmation isn't set up yet. Please choose another payment option." }, { status: 503 });

  const code = newCode();
  const { data: row, error } = await sb.from("otp_codes").insert({ phone, ip, code_hash: hashCode(phone, code), expires_at: new Date(now + 10 * 60 * 1000).toISOString() }).select("id").single();
  if (error || !row) return NextResponse.json({ error: "Could not create a code. Please try again." }, { status: 500 });
  if (test) return NextResponse.json({ sent: true, testCode: code });
  const r = await sendWhatsAppCode(phone, code);
  if (!r.ok) {
    await sb.from("otp_codes").delete().eq("id", row.id);      // a failed send must not lock the customer out of trying again
    return NextResponse.json({ error: "We couldn't send the WhatsApp code. Check the number has WhatsApp, or choose another payment option.", ref: r.code ? `WA-${r.code}` : r.network ? "WA-NET" : `WA-${r.status || "ERR"}` }, { status: 502 });
  }
  return NextResponse.json({ sent: true });
}
