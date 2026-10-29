import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SearchProvider } from "@/components/search/search-provider";
import { siteConfig, siteUrl } from "@/config/site";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: siteConfig.name, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  ...(siteUrl && {
    metadataBase: siteUrl,
    openGraph: {
      title: siteConfig.name,
      description: siteConfig.description,
      siteName: siteConfig.name,
      type: "website",
      locale: "id_ID",
    },
  }),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen font-sans antialiased">
        <SearchProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
        </SearchProvider>
      </body>
    </html>
  );
}
