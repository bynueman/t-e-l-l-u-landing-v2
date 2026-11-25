import { IconBadge } from "@/components/ui/icon";

interface ProcessStepItem {
  number: string;
  icon: "message" | "clipboard" | "palette" | "code" | "check";
  title: string;
  tagline: string;
  description: string;
}

const processSteps: readonly ProcessStepItem[] = [
  {
    number: "01",
    icon: "message",
    title: "Konsultasi",
    tagline: "Memahami Kebutuhan",
    description: "Ceritakan tujuan website, profil usaha, serta fungsi yang kamu perlukan agar kami bisa menyarankan ruang lingkup yang tepat.",
  },
  {
    number: "02",
    icon: "clipboard",
    title: "Penawaran & Kesepakatan",
    tagline: "Ruang Lingkup Jelas",
    description: "Kami siapkan proposal berisi rincian fitur, estimasi waktu pengerjaan, batas revisi, dan skema pembayaran bertahap.",
  },
  {
    number: "03",
    icon: "palette",
    title: "Perancangan Desain",
    tagline: "Tata Letak & Visual",
    description: "Kami menyusun rancangan tampilan sesuai identitas bisnismu. Sesi peninjauan dan revisi dilakukan sesuai cakupan paket yang dipilih.",
  },
  {
    number: "04",
    icon: "code",
    title: "Pengembangan & Pengujian",
    tagline: "Implementasi & Uji Layar",
    description: "Website dibangun dengan kode yang rapi, lalu diuji tampilannya di ponsel maupun desktop beserta seluruh formulir dan tautannya.",
  },
  {
    number: "05",
    icon: "check",
    title: "Peluncuran & Serah Terima",
    tagline: "Website Siap Tayang",
    description: "Website ditayangkan pada domain aktif dengan sertifikat SSL, disertai serah terima akses dan panduan pengelolaan CMS bila tersedia.",
  },
] as const;

export function TechnologyProcess({
  title = "Alur pengerjaan dari konsultasi hingga tayang.",
  description = "Setiap proyek dikerjakan bertahap agar ruang lingkup, desain, dan hasil akhirnya jelas sebelum website ditayangkan.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section id="process" className="tech-process-section page-container section-space border-t border-line" aria-labelledby="tech-process-heading">
      <div data-reveal className="tech-section-heading">
        <h2 id="tech-process-heading" className="display">
          {title}
        </h2>
        <p>{description}</p>
      </div>

      <ol data-stagger className="tech-process-timeline">
        {processSteps.map((step) => (
          <li key={step.number} className="tech-process-card">
            <div className="tech-process-card-header">
              <span className="tech-process-num" aria-hidden="true">
                {step.number}
              </span>
              <IconBadge name={step.icon} tone="technology" />
            </div>

            <div className="tech-process-card-body">
              <span className="tech-process-tagline">{step.tagline}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
