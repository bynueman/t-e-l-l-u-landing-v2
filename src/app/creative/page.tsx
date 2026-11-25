import type { Metadata } from "next";
import { EcosystemPage } from "@/components/ecosystem-page";

export const metadata: Metadata = {
  title: "Jasa Branding & Social Media Management",
  description:
    "Jasa branding, desain identitas visual, produksi konten, dan pengelolaan media sosial dari TELLU Creative di Yogyakarta.",
  openGraph: {
    title: "Jasa Branding & Social Media Management | TELLU",
    description:
      "Jasa branding, desain identitas visual, produksi konten, dan pengelolaan media sosial dari TELLU Creative di Yogyakarta.",
    type: "website",
  },
};

export default function Creative() {
  return (
    <EcosystemPage
      ecosystem={{
        name: "Creative",
        tone: "creative",
        introduction:
          "Bangun identitas brand yang konsisten dan hadirkan konten yang relevan dengan audiensmu. TELLU Creative melayani jasa branding, desain komunikasi visual, produksi konten, dan pengelolaan media sosial.",
        sectionHeading: "Layanan branding, konten, dan media sosial.",
        sectionSubheading:
          "Kami membantu merapikan tampilan visual brand sekaligus menjaga aktivitas konten agar pesan bisnismu tersampaikan dengan jelas.",
        ctaHeading: "Ingin merapikan tampilan brand atau jadwal kontenmu?",
        ctaDescription:
          "Ceritakan kebutuhan desain branding, produksi konten, atau pengelolaan media sosial bisnismu melalui WhatsApp tim TELLU.",
        whatsappMessage: "Halo TELLU, saya ingin berkonsultasi mengenai layanan Creative dan pengelolaan media sosial.",
        sections: [
          {
            id: "creative-agency",
            icon: "palette",
            title: "Creative Agency",
            description:
              "Untuk bisnis yang sedang membangun identitas baru atau ingin merapikan tampilan visual agar lebih konsisten di berbagai materi promosi.",
            points: [
              "Perancangan identitas visual dan panduan dasar penggunaan brand",
              "Desain materi promosi, katalog, dan kebutuhan komunikasi kampanye",
              "Produksi konten grafis atau materi visual sesuai karakter audiens",
            ],
          },
          {
            id: "social-media",
            icon: "message",
            title: "Social Media Management",
            description:
              "Untuk bisnis yang membutuhkan pengelolaan akun media sosial secara rutin agar tetap aktif, informatif, dan selaras dengan identitas brand.",
            points: [
              "Penyusunan rencana tema konten dan kalender publikasi",
              "Pembuatan desain visual dan penulisan caption untuk kanal yang dikelola",
              "Penjadwalan publikasi dan koordinasi konten sesuai kesepakatan kerja",
            ],
          },
        ],
      }}
    />
  );
}
