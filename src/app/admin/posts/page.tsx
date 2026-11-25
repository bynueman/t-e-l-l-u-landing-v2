import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { PostsManager } from "@/components/admin/posts-manager";
import { Icon } from "@/components/ui/icon";
import { requireAdminPageSession } from "@/lib/cms/admin-page-guard";
import { listCategories } from "@/lib/cms/categories";
import { getDb } from "@/lib/cms/db";
import { listAdminPosts } from "@/lib/cms/posts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Artikel — TELLU Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPostsPage() {
  const user = await requireAdminPageSession();
  const db = getDb();
  const categories = listCategories(db);
  const result = listAdminPosts(db, user, { page: 1, pageSize: 25 });

  return (
    <AdminShell
      user={user}
      title="Kelola Artikel"
      breadcrumb={[
        { label: "Dashboard", href: "/admin" },
        { label: "Artikel" },
      ]}
      actions={
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-white hover:bg-[#343632]"
        >
          <Icon name="plus" className="w-3.5 h-3.5" />
          Tulis Artikel Baru
        </Link>
      }
    >
      <PostsManager
        user={user}
        initialItems={result.items}
        initialTotal={result.total}
        categories={categories}
      />
    </AdminShell>
  );
}
