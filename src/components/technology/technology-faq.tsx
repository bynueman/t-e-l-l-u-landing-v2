import { Icon } from "@/components/ui/icon";

interface FaqItem {
  question: string;
  answer: string;
}

const technologyFaqs: readonly FaqItem[] = [
  {
    question: "Berapa biaya pembuatan website di TELLU?",
    answer:
      "Pembuatan website baru dimulai dari Rp1,5 juta (draft referensi paket Starter untuk 1 halaman landing page), sedangkan paket Business multi-halaman dengan CMS mulai dari Rp3,5 juta. Layanan revamp website dimulai dari Rp2,5 juta. Biaya final ditentukan setelah jumlah halaman dan fitur disepakati dalam proposal resmi.",
  },
  {
    question: "Apa saja yang termasuk dalam paket website?",
    answer:
      "Setiap paket website baru mencakup desain custom yang menyesuaikan layar ponsel dan desktop, integrasi tombol WhatsApp atau formulir kontak, struktur SEO on-page dasar, serta bantuan domain (.com/.id), hosting, dan SSL untuk tahun pertama. Paket Business ke atas juga menyertakan panel admin CMS.",
  },
  {
    question: "Apa perbedaan website baru dan revamp website?",
    answer:
      "Website baru dibangun dari awal untuk bisnis yang belum memiliki situs, sedangkan revamp ditujukan untuk memperbarui website yang sudah ada. Pada layanan revamp, kami meninjau desain, kecepatan, tampilan ponsel, dan struktur tautan lama sebelum membangun ulang tampilan atau kodenya.",
  },
  {
    question: "Apakah website dapat dikelola sendiri setelah selesai?",
    answer:
      "Bisa, apabila kamu memilih paket dengan CMS (seperti Business atau Enterprise) atau menambahkan fitur Panel Admin (CMS). Melalui CMS, kamu dapat mengubah teks, mengganti foto, dan mengelola konten secara mandiri tanpa harus mengedit kode.",
  },
  {
    question: "Apakah domain dan hosting termasuk, atau boleh memakai milik sendiri?",
    answer:
      "Paket pembuatan website baru sudah menyertakan bantuan registrasi domain (.com/.id) dan hosting untuk 1 tahun pertama, dan kamu juga tetap dapat memakai domain atau hosting sendiri. Untuk aset yang sudah ada, tim kami akan meninjau akses dan kompatibilitas konfigurasinya terlebih dahulu.",
  },
  {
    question: "Bagaimana proses pengerjaan dan sistem pembayarannya?",
    answer:
      "Pengerjaan dimulai dari konsultasi kebutuhan, pengiriman penawaran resmi, perancangan desain, pengembangan dan pengujian, hingga peluncuran. Pembayaran umumnya dilakukan bertahap (uang muka di awal dan pelunasan setelah selesai), dengan estimasi waktu mulai 2–5 hari kerja untuk landing page hingga 14–30 hari kerja untuk kebutuhan kustom.",
  },
  {
    question: "Apakah tersedia layanan perawatan (maintenance)?",
    answer:
      "Tersedia layanan perawatan bulanan mulai Rp500.000 per bulan (draft referensi). Cakupannya meliputi pembaruan konten sesuai kuota, pencadangan (backup) berkala, pemantauan kondisi website, serta bantuan perbaikan teknis ringan sesuai kesepakatan.",
  },
  {
    question: "Apakah TELLU melayani bisnis di luar Yogyakarta?",
    answer:
      "TELLU berbasis di Yogyakarta, Indonesia, dan konsultasi maupun koordinasi pengerjaan proyek dapat dilakukan secara online melalui WhatsApp, email, atau pertemuan daring sesuai kebutuhanmu.",
  },
] as const;

export function TechnologyFaq({
  title = "Pertanyaan yang sering diajukan.",
  description = "Jawaban singkat seputar biaya, cakupan paket, proses pengerjaan, dan perawatan website.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section id="faq" className="tech-faq-section page-container section-space border-t border-line" aria-labelledby="tech-faq-heading">
      <div className="tech-faq-layout">
        <div data-reveal className="tech-faq-intro">
          <h2 id="tech-faq-heading" className="display">
            {title}
          </h2>
          <p className="text-muted mt-4">
            {description}
          </p>
          <div className="mt-8">
            <a href="#contact" className="button-outline text-sm inline-flex items-center gap-2">
              <span>Konsultasikan Kebutuhanmu</span>
              <Icon name="message" size={16} />
            </a>
          </div>
        </div>

        <div className="tech-faq-accordion" data-reveal>
          {technologyFaqs.map((faq) => (
            <details key={faq.question} className="tech-faq-item">
              <summary className="tech-faq-summary">
                <span className="faq-question-text">{faq.question}</span>
                <span className="faq-chevron" aria-hidden="true">
                  +
                </span>
              </summary>
              <div className="tech-faq-content">
                <p>{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
