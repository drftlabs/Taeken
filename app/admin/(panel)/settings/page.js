import { serviceClient } from "@/lib/supabase/server";
import SettingsForm from "@/components/admin/SettingsForm";
import { SETTINGS } from "@/lib/fallback";

export default async function Settings() {
  const { data } = await serviceClient().from("site_settings").select("value").eq("key", "site").maybeSingle();
  return <><h1>Settings</h1><p className="sub">Ticker, business details, contact info, shipping and policy numbers. Policy pages pick these up automatically.</p><SettingsForm settings={{ ...SETTINGS, ...(data?.value || {}) }} /></>;
}
