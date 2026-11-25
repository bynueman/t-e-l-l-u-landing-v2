import type { Metadata } from "next";
import { EcosystemPage } from "@/components/ecosystem-page";

export const metadata: Metadata = {
  title: "Solusi Sistem Digital & SaaS untuk Bisnis",
  description:
    "Layanan pengembangan software bisnis, sistem operasional, dan solusi SaaS dari TELLU Business untuk membantu kerja tim lebih terstruktur.",
  openGraph: {
    title: "Solusi Sistem Digital & SaaS untuk Bisnis | TELLU",
    description:
      "Layanan pengembangan software bisnis, sistem operasional, dan solusi SaaS dari TELLU Business untuk membantu kerja tim lebih terstruktur.",
    type: "website",
  },
};

export default function Business() {
  return (
    <EcosystemPage
      ecosystem={{
        name: "Business",
        tone: "business",
        introduction:
          "Pencatatan yang masih tersebar di banyak file dan pekerjaan administratif yang berulang sering menghambat operasional usaha. TELLU Business membantu menyiapkan software bisnis berbasis web serta solusi SaaS yang disesuaikan dengan alur kerja timmu.",
        sectionHeading: "Dari pencatatan manual ke sistem kerja yang lebih rapi.",
        sectionSubheading:
          "Kami membedakan produk SaaS yang sudah tersedia dan pengembangan software bisnis custom agar penerapannya realistis bagi bisnismu.",
        ctaHeading: "Ingin mendiskusikan kebutuhan sistem digital bisnismu?",
        ctaDescription:
          "Konsultasikan kendala pencatatan, alur kerja tim, atau kebutuhan software operasional bisnismu bersama tim TELLU.",
        whatsappMessage: "Halo TELLU, saya ingin berkonsultasi mengenai solusi SaaS dan sistem digital di TELLU Business.",
        sections: [
          {
            id: "products",
            icon: "app",
            title: "Produk SaaS: Intrax",
            description:
              "Intrax adalah produk SaaS untuk pencatatan keuangan dan operasional bisnis yang dapat diakses melalui browser. Informasi fitur yang tersedia saat ini dapat dilihat langsung di intrax.web.id sebelum sesi konsultasi.",
            points: [
              "Membantu pencatatan keuangan dan aktivitas operasional usaha dalam satu tempat",
              "Berbasis web sehingga mudah diakses oleh tim tanpa instalasi rumit",
              "Detail kecocokan kebutuhan dan penggunaan dibahas langsung saat konsultasi",
            ],
          },
          {
            id: "custom-software",
            icon: "code",
            title: "Pengembangan Sistem Bisnis Custom",
            description:
              "Untuk bisnis yang memiliki alur kerja khusus dan belum tercukupi oleh aplikasi siap pakai. Lingkup fitur, struktur data, dan integrasi dirancang berdasarkan proses operasional nyata di timmu.",
            points: [
              "Pemetaan alur kerja manual dan administrasi berulang sebelum pengembangan",
              "Penyusunan sistem pencatatan atau pelaporan internal berbasis web",
              "Diskusi integrasi dengan website atau kanal digital yang sudah digunakan",
            ],
          },
        ],
      }}
    />
  );
}
