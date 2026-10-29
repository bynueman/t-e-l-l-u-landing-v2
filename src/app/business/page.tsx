import type { Metadata } from "next";
import { EcosystemPage } from "@/components/ecosystem-page";

export const metadata: Metadata = { title: "Business", description: "Jelajahi ekosistem Business TELLU dan kategori produk SaaS." };

export default function Business() {
  return <EcosystemPage ecosystem={{ name: "Business", tone: "business", eyebrow: "03 / Business", accent: "Evolve", introduction: "Ruang untuk produk software yang mendukung kebutuhan bisnis. Informasi produk spesifik akan ditambahkan setelah tersedia dan terverifikasi.", sections: [
    { id: "products", icon: "app", title: "SaaS Products", description: "Kategori produk software TELLU. Nama produk, fitur, dan ketersediaannya belum diumumkan di situs ini." },
  ] }} />;
}
