import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabase/server";
import { normalizePhone, hashCode, safeEq, signToken } from "@/lib/otp";

export async function POST(req) {
  let b = {}; try { b = await req.json(); } catch {}
  const phone = normalizePhone(b.phone), code = String(b.code || "").replace(/\D/g, "");
  if (!phone || code.length !== 4) return NextResponse.json({ error: "Enter the 4-digit code." }, { status: 400 });
  const sb = serviceClient(); if (!sb) return NextResponse.json({ error: "The store backend isn't connected yet." }, { status: 503 });
  const { data: row } = await sb.from("otp_codes").select("*").eq("phone", phone).eq("verified", false).gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!row) return NextResponse.json({ error: "That code has expired. Tap resend to get a new one.", expired: true }, { status: 400 });
  if (row.attempts >= 5) return NextResponse.json({ error: "Too many wrong tries. Tap resend to get a new code.", expired: true }, { status: 429 });
  if (!safeEq(row.code_hash, hashCode(phone, code))) {
    await sb.from("otp_codes").update({ attempts: row.attempts + 1 }).eq("id", row.id);
    const left = 4 - row.attempts;
    return NextResponse.json({ error: left > 0 ? `Wrong code. ${left} ${left === 1 ? "try" : "tries"} left.` : "Too many wrong tries. Tap resend to get a new code.", expired: left <= 0 }, { status: 400 });
  }
  await sb.from("otp_codes").update({ verified: true }).eq("id", row.id);
  return NextResponse.json({ ok: true, token: signToken(phone) });
}
