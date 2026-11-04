import { getAdmin } from "@/lib/admin";
import { serviceClient } from "@/lib/supabase/server";
import { toCSV } from "@/lib/csv";

export const dynamic = "force-dynamic";

// Download orders as CSV. Optional ?status=paid  (the same file layout works for the courier / shipping partner).
export async function GET(req) {
  if (!(await getAdmin())) return new Response("Unauthorized", { status: 401 });
  const status = new URL(req.url).searchParams.get("status");
  let q = serviceClient().from("orders").select("*").neq("status", "pending_payment").order("created_at", { ascending: false }).limit(5000);
  if (status && status !== "all") q = q.eq("status", status);
  const { data } = await q;
  const rows = (data || []).map((o) => ({
    order_number: o.order_number, date: o.created_at, status: o.status, name: o.name, email: o.email, phone: o.phone,
    address: [o.shipping_address?.line1, o.shipping_address?.line2].filter(Boolean).join(", "), city: o.shipping_address?.city, state: o.shipping_address?.state, pin: o.shipping_address?.pin,
    items: (o.items || []).map((i) => `${i.name} UK${i.size} x${i.qty}`).join(" | "), quantity: (o.items || []).reduce((t, i) => t + i.qty, 0),
    subtotal: o.subtotal, shipping: o.shipping, total: o.total, payment_id: o.razorpay_payment_id,
    courier: o.courier || "", tracking_number: o.tracking_number || "", tracking_url: o.tracking_url || "",
  }));
  const cols = ["order_number", "date", "status", "name", "email", "phone", "address", "city", "state", "pin", "items", "quantity", "subtotal", "shipping", "total", "payment_id", "courier", "tracking_number", "tracking_url"];
  return new Response(toCSV(rows, cols), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="taeken-orders-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
