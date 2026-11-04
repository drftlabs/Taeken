import { serviceClient } from "@/lib/supabase/server";
import ResourceManager from "@/components/admin/ResourceManager";

const fields = [
  { name: "name", label: "Collection name", type: "text", help: "Rename any time. The page URL stays the same unless you change the slug." },
  { name: "slug", label: "URL slug", type: "text", help: "taeken.in/collections/<slug>" },
  { name: "kanji", label: "Kanji accent (optional)", type: "text", help: "One character shown on the tile, e.g. 高" },
  { name: "image", label: "Tile image", type: "image", folder: "collections", hint: "Portrait or square photo, about 1200px wide.", full: true },
  { name: "position", label: "Image focus (CSS position)", type: "text", help: "e.g. 50% 30% to keep the top of the photo visible" },
  { name: "show_home", label: "Show on homepage", type: "checkbox" },
  { name: "active", label: "Collection is live", type: "checkbox" },
];
export default async function Page() {
  const { data } = await serviceClient().from("collections").select("*").order("sort_order");
  return <><h1>Collections</h1><p className="sub">These are the “Pick your shape” tiles. Change names and images here and they update on the homepage, footer and collection pages. Use ▲▼ to reorder.</p>
    <ResourceManager table="collections" rows={data || []} fields={fields} sortable blank={{ name: "", slug: "", kanji: "", image: "", position: "50% 50%", show_home: true, active: true }} /></>;
}
