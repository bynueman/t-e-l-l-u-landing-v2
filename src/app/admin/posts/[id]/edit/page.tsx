import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { PostEditorWorkspace } from "@/components/admin/post-editor-workspace";
import { requireAdminPageSession } from "@/lib/cms/admin-page-guard";
import { listCategories } from "@/lib/cms/categories";
import { getDb } from "@/lib/cms/db";
import { getAdminPostById } from "@/lib/cms/posts";
import { listAdminUsers } from "@/lib/cms/users";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit Artikel — TELLU Admin",
  robots: { index: false, follow: false },
};

export default async function EditAdminPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdminPageSession();
  const { id } = await params;
  const db = getDb();
  const post = getAdminPostById(db, user, id);
  if (!post) notFound();

  const categories = listCategories(db);
  const authors = listAdminUsers(db)
    .filter((u) => u.status === "active")
    .map((u) => ({ id: u.id, name: u.name, role: u.role }));

  return (
    <AdminShell
      user={user}
      title={`Edit: ${post.title}`}
      breadcrumb={[
        { label: "Dashboard", href: "/admin" },
        { label: "Artikel", href: "/admin/posts" },
        { label: "Edit" },
      ]}
    >
      <PostEditorWorkspace
        user={user}
        initialPost={post}
        categories={categories}
        authors={authors}
      />
    </AdminShell>
  );
}
