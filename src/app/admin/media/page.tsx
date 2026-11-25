import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { MediaManager } from "@/components/admin/media-manager";
import { requireAdminPageSession } from "@/lib/cms/admin-page-guard";
import { getDb } from "@/lib/cms/db";
import { listMedia } from "@/lib/cms/media";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Media Library — TELLU Admin",
  robots: { index: false, follow: false },
};

export default async function AdminMediaPage() {
  const user = await requireAdminPageSession();
  const items = listMedia(getDb());

  return (
    <AdminShell
      user={user}
      title="Media Library"
      breadcrumb={[
        { label: "Dashboard", href: "/admin" },
        { label: "Media Library" },
      ]}
    >
      <MediaManager initialItems={items} userRole={user.role} />
    </AdminShell>
  );
}
