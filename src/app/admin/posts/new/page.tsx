import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { PostEditorWorkspace } from "@/components/admin/post-editor-workspace";
import { requireAdminPageSession } from "@/lib/cms/admin-page-guard";
import { listCategories } from "@/lib/cms/categories";
import { getDb } from "@/lib/cms/db";
import { listAdminUsers } from "@/lib/cms/users";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tulis Artikel Baru — TELLU Admin",
  robots: { index: false, follow: false },
};

export default async function NewAdminPostPage() {
  const user = await requireAdminPageSession();
  const db = getDb();
  const categories = listCategories(db);
  const authors = listAdminUsers(db)
    .filter((u) => u.status === "active")
    .map((u) => ({ id: u.id, name: u.name, role: u.role }));

  return (
    <AdminShell
      user={user}
      title="Tulis Artikel Baru"
      breadcrumb={[
        { label: "Dashboard", href: "/admin" },
        { label: "Artikel", href: "/admin/posts" },
        { label: "Artikel Baru" },
      ]}
    >
      <PostEditorWorkspace user={user} categories={categories} authors={authors} />
    </AdminShell>
  );
}
