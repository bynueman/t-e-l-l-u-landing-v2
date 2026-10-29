import type { Metadata } from "next";
import { EcosystemPage } from "@/components/ecosystem-page";

export const metadata: Metadata = { title: "Creative", description: "Jelajahi ekosistem Creative TELLU: Creative Agency dan Social Media Management." };

export default function Creative() {
  return <EcosystemPage ecosystem={{ name: "Creative", tone: "creative", eyebrow: "02 / Creative", accent: "Express", introduction: "Ide membutuhkan cara untuk terlihat dan terdengar. Jelajahi kerja kreatif serta pengelolaan media sosial di TELLU.", sections: [
    { id: "creative-agency", icon: "palette", title: "Creative Agency", description: "Pendekatan kreatif untuk komunikasi visual dan konten. Ruang lingkup layanan dapat disesuaikan setelah kebutuhan Anda dipahami." },
    { id: "social-media", icon: "message", title: "Social Media Management", description: "Dukungan untuk pengelolaan kehadiran media sosial. Kanal, ritme, dan kebutuhan konten dibahas berdasarkan konteks brand Anda." },
  ] }} />;
}
