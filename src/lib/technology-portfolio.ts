// Source: YUKWebsite src/content/portfolio.ts; embedding remains subject to remote policy.
export type TechnologyProject = {
  id: string; name: string; category: string; description: string;
  url: string; image: string; embeddable: boolean;
  previewUrl?: string;
  previewType?: "remote-iframe";
  previewStatus?: "pending-server-permission" | "approved";
};

export const technologyProjects: readonly TechnologyProject[] = [
  { id: "yuk-education", name: "YUK Education", category: "Company Profile / Pendidikan", description: "Website konsultan pendidikan dengan informasi destinasi studi, edutrip, artikel, dan events.", url: "https://yukeducation.co.id/", image: "/images/technology/yuk-education-cover.jpg", embeddable: true },
  { id: "sukarindik-jaya-per", name: "Sukarindik Jaya Per", category: "Company Profile / Otomotif", description: "Website bengkel spesialis kaki-kaki mobil dengan informasi layanan dan booking service online.", url: "https://sukarindikjayaper.id/", image: "/images/technology/sukarindik-jaya-per-cover.jpg", embeddable: true },
  { id: "cafe-go-digital", name: "Cafe Go Digital", category: "Website Revamp / Agency", description: "Revamp website agency digital untuk coffee shop dengan presentasi layanan dan produk.", url: "https://cafegodigital.store/", image: "/images/technology/cafegodigital-cover.jpg", embeddable: true },
  { id: "intrax", name: "Intrax", category: "Landing Page / SaaS", description: "Landing page produk SaaS untuk pencatatan keuangan dan operasional bisnis.", url: "https://intrax.web.id/", previewUrl: "https://intrax.web.id/", previewType: "remote-iframe", previewStatus: "pending-server-permission", image: "/images/technology/intrax-cover.jpg", embeddable: false },
] as const;
