// Source: YUKWebsite src/content/portfolio.ts; embedding remains subject to remote policy.
export type TechnologyProject = {
  id: string; name: string; category: string; description: string;
  url: string; image: string; embeddable: boolean;
  previewUrl?: string;
  previewType?: "remote-iframe";
  previewStatus?: "pending-server-permission" | "approved";
};

export const technologyProjects: readonly TechnologyProject[] = [
  { id: "yuk-education", name: "YUK Education", category: "Company Profile / Pendidikan", description: "Website company profile untuk konsultan pendidikan yang memuat informasi destinasi studi, program edutrip, artikel, dan agenda acara.", url: "https://yukeducation.co.id/", image: "/images/technology/yuk-education-cover.jpg", embeddable: true },
  { id: "sukarindik-jaya-per", name: "Sukarindik Jaya Per", category: "Company Profile / Otomotif", description: "Website company profile untuk bengkel spesialis kaki-kaki mobil dengan informasi layanan bengkel dan pemesanan servis online.", url: "https://sukarindikjayaper.id/", image: "/images/technology/sukarindik-jaya-per-cover.jpg", embeddable: true },
  { id: "cafe-go-digital", name: "Cafe Go Digital", category: "Website Revamp / Agency", description: "Pembaruan website layanan digital untuk bisnis coffee shop yang menampilkan daftar layanan dan penawaran produk.", url: "https://cafegodigital.store/", image: "/images/technology/cafegodigital-cover.jpg", embeddable: true },
  { id: "intrax", name: "Intrax", category: "Landing Page / SaaS", description: "Landing page produk SaaS untuk pencatatan keuangan dan operasional bisnis.", url: "https://intrax.web.id/", previewUrl: "https://intrax.web.id/", previewType: "remote-iframe", previewStatus: "approved", image: "/images/technology/intrax-cover.jpg", embeddable: true },
] as const;
