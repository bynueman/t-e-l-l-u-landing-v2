export const searchDestinations = [
  { label: "Website Revamp", href: "/technology#website-revamp", phrases: ["revamp website", "redesign website", "perbarui website"], keywords: ["revamp", "redesign"] },
  { label: "Selected Works", href: "/technology#selected-work", phrases: ["lihat portfolio website", "website portfolio", "lihat portofolio", "selected works"], keywords: ["portfolio", "portofolio"] },
  { label: "Web Development", href: "/technology#web-development", phrases: ["buat website", "bikin website", "web development", "company website"], keywords: ["website", "web", "situs", "site"] },
  { label: "Domain Services", href: "/technology#domain", phrases: ["beli domain", "nama domain", "domain name"], keywords: ["domain", "hosting"] },
  { label: "Social Media Management", href: "/creative#social-media", phrases: ["kelola instagram", "social media", "media sosial"], keywords: ["instagram", "sosmed", "tiktok", "sosial"] },
  { label: "Creative Agency", href: "/creative#creative-agency", phrases: ["bikin konten", "buat konten", "creative agency", "desain brand"], keywords: ["konten", "content", "branding", "desain", "design", "kreatif"] },
  { label: "SaaS Products", href: "/business#products", phrases: ["aplikasi bisnis", "business software", "saas product"], keywords: ["saas", "software", "aplikasi", "app", "produk"] },
  { label: "Tentang TELLU", href: "/#tentang", phrases: ["apa itu tellu", "about tellu", "tentang tellu"], keywords: ["tellu", "about", "tentang"] },
] as const;

export const fallbackDestinations = [
  { label: "Technology", href: "/technology" },
  { label: "Creative", href: "/creative" },
  { label: "Business", href: "/business" },
];

export function shouldSubmitPrompt(event: { key: string; shiftKey: boolean; isComposing: boolean; keyCode?: number }) {
  return event.key === "Enter" && !event.shiftKey && !event.isComposing && event.keyCode !== 229;
}

export function matchSearch(query: string) {
  const normalized = query.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  if (!normalized) return { kind: "empty" as const, choices: [] };
  const words = new Set(normalized.split(" "));
  const scored = searchDestinations.map((destination) => ({
    label: destination.label,
    href: destination.href,
    score: destination.phrases.reduce((score, phrase) => score + (normalized.includes(phrase) ? 4 : 0), 0)
      + destination.keywords.reduce((score, keyword) => score + (words.has(keyword) ? 2 : 0), 0),
  })).filter((destination) => destination.score >= 2).sort((a, b) => b.score - a.score);
  if (!scored.length) return { kind: "fallback" as const, choices: fallbackDestinations };
  if (scored.length === 1 || scored[0].score - scored[1].score >= 2) return { kind: "direct" as const, choices: [scored[0]] };
  return { kind: "choices" as const, choices: scored.filter((destination) => destination.score >= scored[0].score - 1) };
}

export type IntentEcosystem = "technology" | "creative" | "business";

export function classifyIntentEcosystem(query: string): IntentEcosystem | null {
  const result = matchSearch(query);
  if (result.kind !== "direct" || !result.choices.length) {
    return null;
  }
  const href = result.choices[0].href;
  if (href.startsWith("/technology")) return "technology";
  if (href.startsWith("/creative")) return "creative";
  if (href.startsWith("/business")) return "business";
  return null;
}
