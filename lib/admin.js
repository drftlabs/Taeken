import { redirect } from "next/navigation";
import { sessionClient } from "./supabase/server";

// Returns the logged-in user ONLY if they are listed in the `admins` table.
export async function getAdmin() {
  const sb = sessionClient();
  if (!sb) return null;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  return data ? user : null;
}
export async function requireAdmin() {
  const user = await getAdmin();
  if (!user) redirect("/admin/login");
  return user;
}
