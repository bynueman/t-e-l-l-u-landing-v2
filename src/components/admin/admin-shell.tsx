"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";
import type { AdminUser } from "@/lib/cms/rbac";

interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  matchPrefix?: string;
  roles?: ("owner" | "editor" | "author")[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: "app" },
  { label: "Artikel", href: "/admin/posts", icon: "file-text", matchPrefix: "/admin/posts" },
  { label: "Kategori", href: "/admin/categories", icon: "folder", roles: ["owner", "editor"] },
  { label: "Media Library", href: "/admin/media", icon: "image" },
  { label: "Pengguna", href: "/admin/users", icon: "users", roles: ["owner"] },
  { label: "Activity Log", href: "/admin/activity", icon: "activity", roles: ["owner", "editor"] },
  { label: "Pengaturan", href: "/admin/settings", icon: "settings", roles: ["owner"] },
];

const ROLE_LABELS: Record<AdminUser["role"], string> = {
  owner: "Owner",
  editor: "Editor",
  author: "Author",
};

export function AdminShell({
  user,
  title,
  breadcrumb,
  actions,
  children,
}: {
  user: AdminUser;
  title: string;
  breadcrumb?: { label: string; href?: string }[];
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSidebarOpen(false);
    }
    if (sidebarOpen) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(user.role)
  );

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#f9f7f3] border-r border-[#e6e4dc] px-4 py-5">
      <div>
        <div className="flex items-center justify-between px-2 pb-5 border-b border-[#e6e4dc]">
          <Link href="/admin" className="inline-flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
            <Image
              src="/brand/tellu-logo.png"
              alt="TELLU Logo"
              width={629}
              height={589}
              sizes="28px"
              className="h-7 w-7 object-contain"
              priority
            />
            <span className="font-bold tracking-tight text-base text-[#20211f]">
              TELLU <span className="font-normal text-[#666961]">Admin</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Tutup navigasi"
            className="lg:hidden rounded-lg p-1.5 text-[#666961] hover:bg-black/5 hover:text-[#20211f]"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <nav aria-label="Navigasi Admin" className="mt-5 flex flex-col gap-1">
          {visibleItems.map((item) => {
            const active = item.matchPrefix
              ? pathname.startsWith(item.matchPrefix)
              : pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white text-[#20211f] font-semibold border border-[#e6e4dc] shadow-2xs"
                    : "text-[#55584f] hover:bg-white/70 hover:text-[#20211f]"
                }`}
              >
                <Icon
                  name={item.icon}
                  size={17}
                  className={active ? "text-[#b84300]" : "text-[#666961]"}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-[#e6e4dc] space-y-2">
        <Link
          href="/blog"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-[#55584f] hover:bg-white hover:text-[#20211f] transition-colors"
        >
          <span>Lihat Blog Publik</span>
          <Icon name="external" size={14} />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#fcfbf8]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block lg:w-64 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-68 max-w-[82vw] h-full shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 border-b border-[#e6e4dc] bg-white/95 backdrop-blur-sm px-4 sm:px-8 py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Buka navigasi"
                className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#e6e4dc] bg-white text-[#20211f]"
              >
                <Icon name="menu" size={18} />
              </button>
              <div className="min-w-0">
                {breadcrumb && breadcrumb.length > 0 && (
                  <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#666961] mb-0.5">
                    {breadcrumb.map((b, idx) => (
                      <span key={`${b.label}-${idx}`} className="inline-flex items-center gap-1.5">
                        {idx > 0 && <span aria-hidden="true">/</span>}
                        {b.href ? (
                          <Link href={b.href} className="hover:text-[#20211f]">
                            {b.label}
                          </Link>
                        ) : (
                          <span className="text-[#20211f] font-medium">{b.label}</span>
                        )}
                      </span>
                    ))}
                  </nav>
                )}
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#20211f] truncate">
                  {title}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {actions}
              <div className="hidden sm:flex items-center gap-2.5 border-l border-[#e6e4dc] pl-3">
                <div className="text-right">
                  <span className="block text-xs font-semibold text-[#20211f] leading-tight">
                    {user.name}
                  </span>
                  <span className="block text-xs text-[#666961] leading-tight">
                    {ROLE_LABELS[user.role]}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#e6e4dc] bg-white px-3 py-1.5 text-xs font-semibold text-[#20211f] hover:bg-[#f9f7f3] disabled:opacity-50"
              >
                <Icon name="log-out" size={14} />
                <span>{loggingOut ? "Keluar..." : "Keluar"}</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
