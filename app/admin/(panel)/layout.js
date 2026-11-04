import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import AdminNav from "@/components/admin/AdminNav";

export default async function Panel({ children }) {
  const user = await requireAdmin();
  return (
    <div className="adm-wrap">
      <AdminNav email={user.email} />
      <main className="adm-main">{children}</main>
    </div>
  );
}
