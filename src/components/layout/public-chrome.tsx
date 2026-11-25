"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { TelluBrandPreloader } from "./tellu-brand-preloader";
import { SearchProvider } from "@/components/search/search-provider";

export function PublicChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <TelluBrandPreloader />
      <SearchProvider>
        <SiteHeader />
        {children}
        <SiteFooter />
      </SearchProvider>
    </>
  );
}
