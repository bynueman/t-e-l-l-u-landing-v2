import type { Metadata } from "next";
import { PublicChrome } from "@/components/layout/public-chrome";
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
    <html lang="id" data-scroll-behavior="smooth">
      <body className="min-h-screen font-sans antialiased">
        <PublicChrome>{children}</PublicChrome>
      </body>
    </html>
  );
}
