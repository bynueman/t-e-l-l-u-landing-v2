import { metadata } from "@/i18n/dictionaries/id";

export const siteConfig = {
  name: "TELLU",
  description:
    metadata.description,
} as const;

function getSiteUrl(): URL | undefined {
  const value = process.env.NEXT_PUBLIC_SITE_URL;
  if (!value) return undefined;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return undefined;
    return url;
  } catch {
    return undefined;
  }
}

export const siteUrl = getSiteUrl();
