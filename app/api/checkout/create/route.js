import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { serviceClient, sessionClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";
const clean = (v, n = 200) => String(v ?? "").trim().slice(0, n);

// Step 1 of payment: re-price the bag from the DATABASE (never trust browser prices), save the order, create a Razorpay order.
export async function POST(req) {
  const sb = serviceClient();
  if (!sb || !process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return NextResponse.json({ error: "Payments are not configured yet." }, { status: 503 });
  let body; try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }
  const c = body.customer || {}, a = body.address || {};
  const customer = { name: clean(c.name, 120), email: clean(c.email).toLowerCase(), phone: clean(c.phone, 15).replace(/[^\d+]/g, "") };
  const address = { line1: clean(a.line1), line2: clean(a.line2), city: clean(a.city, 80), state: clean(a.state, 60), pin: clean(a.pin, 6) };
  if (!customer.name || !/^\S+@\S+\.\S+$/.test(customer.email) || customer.phone.replace(/\D/g, "").length < 10) return NextResponse.json({ error: "Please enter your name, a valid email and a 10-digit phone number." }, { status: 400 });
  if (!address.line1 || !address.city || !address.state || !/^\d{6}$/.test(address.pin)) return NextResponse.json({ error: "Please complete your delivery address (6-digit pin code)." }, { status: 400 });
  const req_items = Array.isArray(body.items) ? body.items.slice(0, 30) : [];
  if (!req_items.length) return NextResponse.json({ error: "Your bag is empty." }, { status: 400 });

  const ids = [...new Set(req_items.map((i) => i.id))];
  const { data: prods } = await sb.from("products").select("id,name,price,images,sizes,active").in("id", ids);
  const byId = Object.fromEntries((prods || []).map((p) => [p.id, p]));
  const items = [];
  for (const it of req_items) {
    const p = byId[it.id]; const qty = Math.max(1, Math.min(10, parseInt(it.qty) || 1)); const size = String(it.size);
    if (!p || !p.active) return NextResponse.json({ error: "An item in your bag is no longer available." }, { status: 409 });
    if ((Number(p.sizes?.[size]) || 0) < qty) return NextResponse.json({ error: `${p.name} (UK ${size}) is out of stock or has fewer pairs left than you asked for.` }, { status: 409 });
    items.push({ id: p.id, name: p.name, size, qty, price: p.price, image: p.images?.[0] || "" });
  }
  const s = await getSettings();
  const subtotal = items.reduce((t, i) => t + i.price * i.qty, 0);
  const shipping = subtotal >= Number(s.free_shipping_min) ? 0 : Number(s.shipping_fee) || 0;
  const total = subtotal + shipping;

  let userId = null;
  try { const ses = sessionClient(); const { data: { user } } = await ses.auth.getUser(); userId = user?.id || null; } catch {}

  const { data: order, error } = await sb.from("orders").insert({ user_id: userId, email: customer.email, phone: customer.phone, name: customer.name, shipping_address: address, items, subtotal, shipping, total, status: "pending_payment" }).select().single();
  if (error) return NextResponse.json({ error: "Could not create your order. Please try again." }, { status: 500 });

  try {
    const rzp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    const ro = await rzp.orders.create({ amount: total * 100, currency: "INR", receipt: order.order_number, notes: { order_id: order.id } });
    await sb.from("orders").update({ razorpay_order_id: ro.id }).eq("id", order.id);
    return NextResponse.json({ orderId: order.id, orderNumber: order.order_number, rzpOrderId: ro.id, amount: total * 100, key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID, prefill: customer });
  } catch (e) {
    console.error("[razorpay create]", e);
    return NextResponse.json({ error: "Payment gateway error. Please try again." }, { status: 502 });
  }
}
