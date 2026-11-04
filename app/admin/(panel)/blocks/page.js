import { serviceClient } from "@/lib/supabase/server";
import ResourceManager from "@/components/admin/ResourceManager";

const base = [{ name: "title", label: "Admin label", type: "text", help: "Only you see this." }, { name: "enabled", label: "Show on homepage", type: "checkbox" }];
const fieldsByType = {
  hero: [...base],
  products: [...base,
    { name: "config.eyebrow", label: "Small heading", type: "text" }, { name: "config.title", label: "Heading", type: "text", help: "Use | for a line break; the last line is red." },
    { name: "config.source", label: "Which products", type: "select", options: [["all", "All products"], ["tag", "Only a tag"], ["collection", "Only a collection"]] },
    { name: "config.source_value", label: "Tag or collection slug", type: "text", help: "e.g. new-drop or high-tops (needed if you chose Tag/Collection)" },
    { name: "config.limit", label: "Max products", type: "number" }, { name: "config.collapse", label: "Show 2 rows + blurred “View all”", type: "checkbox" }],
  banner: [...base,
    { name: "config.variant", label: "Style", type: "select", options: [["campaign", "Campaign (text bottom-right)"], ["next", "Next drop (text bottom-left)"]] },
    { name: "config.plate", label: "Number plate", type: "text", help: "e.g. 001" }, { name: "config.kicker", label: "Small label", type: "text" },
    { name: "config.title", label: "Headline", type: "text", help: "Use | for a line break." }, { name: "config.cta_text", label: "Button text", type: "text" }, { name: "config.link", label: "Button link", type: "text" },
    { name: "config.image", label: "Desktop image", type: "image", folder: "banners", hint: "Wide, about 2400×1200px.", full: true },
    { name: "config.image_mobile", label: "Mobile image (optional)", type: "image", folder: "banners", full: true }, { name: "config.position", label: "Image focus", type: "text" }],
  collections: [...base, { name: "config.eyebrow", label: "Small heading", type: "text" }, { name: "config.title", label: "Heading", type: "text" }, { name: "__note", label: "", type: "text" }],
  story: [...base,
    { name: "config.eyebrow", label: "Small heading", type: "text" }, { name: "config.title", label: "Heading", type: "text", help: "Use | for a line break." },
    { name: "config.text", label: "Paragraph", type: "textarea", full: true }, { name: "config.link_text", label: "Link text", type: "text" }, { name: "config.link", label: "Link", type: "text" },
    { name: "config.image", label: "Image", type: "image", folder: "story", full: true }, { name: "config.position", label: "Image focus", type: "text" }],
};
fieldsByType.collections = fieldsByType.collections.filter((f) => f.name !== "__note");

export default async function Page() {
  const { data } = await serviceClient().from("blocks").select("*").order("sort_order");
  return <><h1>Block placement</h1><p className="sub">Control the homepage layout. Use ▲▼ to place each block higher or lower, switch blocks on/off, and edit their text and images. You can add extra product rows (for example a “Bestsellers” strip filtered by tag) or more banners.</p>
    <ResourceManager table="blocks" rows={data || []} fieldsByType={fieldsByType} sortable titleKey="title"
      newTypes={[["products", "Product row"], ["banner", "Banner"], ["collections", "Collections tiles"], ["story", "Story"], ["hero", "Hero slider"]]} blank={{ enabled: true }} /></>;
}
