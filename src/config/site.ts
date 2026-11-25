export const contactConfig = {
  whatsapp: {
    number: "628158819099",
    displayNumber: "+62 815-8819-099",
    url: "https://wa.me/628158819099",
    getDirectUrl: (customMessage?: string) => {
      const base = "https://wa.me/628158819099";
      if (!customMessage) return base;
      return `${base}?text=${encodeURIComponent(customMessage)}`;
    },
    defaultMessage: "Halo TELLU, saya ingin berkonsultasi mengenai kebutuhan digital bisnis saya.",
  },
  email: {
    address: "info@tellu.co",
    url: "mailto:info@tellu.co",
  },
  instagram: {
    handle: "@tellu.co",
    url: "https://www.instagram.com/tellu.co/",
  },
  location: {
    city: "Yogyakarta",
    country: "Indonesia",
    label: "Yogyakarta, Indonesia",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Yogyakarta,+Indonesia",
  },
} as const;

export const siteConfig = {
  name: "TELLU",
  description:
    "TELLU adalah digital agency di Yogyakarta yang melayani jasa pembuatan website profesional, branding dan konten kreatif, pengelolaan media sosial, serta software bisnis.",
  contact: contactConfig,
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
