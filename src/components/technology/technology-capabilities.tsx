import { IconBadge } from "@/components/ui/icon";

interface WebsiteTypeItem {
  title: string;
  tagline: string;
  description: string;
}

const websiteTypes: readonly WebsiteTypeItem[] = [
  {
    title: "Landing Page",
    tagline: "Satu Halaman Terarah",
    description: "Fokus menjelaskan satu penawaran utama atau kampanye promosi agar pengunjung langsung diarahkan ke WhatsApp atau formulir kontak.",
  },
  {
    title: "Company Profile",
    tagline: "Profil Bisnis & Perusahaan",
    description: "Memperkenalkan profil usaha, daftar layanan, dan informasi kontak secara terstruktur bagi calon pelanggan maupun mitra kerja.",
  },
  {
    title: "Portfolio & Showcase",
    tagline: "Karya & Dokumentasi Proyek",
    description: "Menampilkan daftar proyek, galeri hasil kerja, dan deskripsi layanan dengan tata letak yang rapi serta mudah ditelusuri.",
  },
  {
    title: "Edukasi & Institusi",
    tagline: "Pusat Informasi & Program",
    description: "Website untuk lembaga kursus, sekolah, atau konsultan pendidikan yang memuat daftar program, jadwal, dan artikel informasi.",
  },
  {
    title: "Katalog Produk & Usaha",
    tagline: "Etalase Digital Rapi",
    description: "Menampilkan daftar produk atau layanan dengan kategori, detail informasi, dan tombol pemesanan langsung ke admin.",
  },
  {
    title: "E-Commerce & Booking",
    tagline: "Transaksi & Reservasi",
    description: "Sistem pemesanan jadwal atau penjualan online dengan keranjang belanja dan integrasi pembayaran sesuai kesepakatan proposal.",
  },
];

interface PracticalBenefit {
  icon: "browser" | "refresh" | "code" | "check" | "wrench" | "globe" | "clipboard";
  title: string;
  description: string;
}

const practicalBenefits: readonly PracticalBenefit[] = [
  {
    icon: "browser",
    title: "Tampilan Rapi di Ponsel dan Desktop",
    description: "Tata letak dan ukuran teks disesuaikan agar tetap nyaman dibaca serta mudah digunakan di layar ponsel, tablet, maupun desktop.",
  },
  {
    icon: "clipboard",
    title: "Struktur Ramah Mesin Pencari",
    description: "Menggunakan struktur heading semantik, meta deskripsi, Open Graph, dan sitemap XML agar halaman mudah dibaca oleh mesin pencari.",
  },
  {
    icon: "code",
    title: "Desain Menyesuaikan Bisnis",
    description: "Setiap antarmuka disusun mengikuti identitas visual dan alur informasi bisnismu, bukan sekadar mengisi ulang template yang seragam.",
  },
  {
    icon: "refresh",
    title: "Perhatian pada Kecepatan Muat",
    description: "Ukuran gambar, skrip, dan caching diatur seefisien mungkin agar halaman terbuka cepat dan nyaman diakses.",
  },
  {
    icon: "wrench",
    title: "Panel CMS yang Mudah Dipakai",
    description: "Untuk paket yang mencakup CMS, tim kamu bisa memperbarui teks, foto, atau artikel secara mandiri tanpa harus mengedit kode.",
  },
  {
    icon: "check",
    title: "Konfigurasi Keamanan Dasar",
    description: "Website dilengkapi koneksi terenkripsi HTTPS (SSL), validasi formulir kontak, serta pengaturan dasar untuk mengurangi spam.",
  },
];

export function TechnologyCapabilities({
  title = "Jenis website yang dapat dibangun.",
  description = "Setiap usaha punya tujuan website yang berbeda. Berikut jenis website dan standar pengerjaan yang kami siapkan sesuai kebutuhanmu.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section id="capabilities" className="tech-capabilities-section page-container section-space" aria-labelledby="tech-capabilities-heading">
      <div data-reveal className="tech-section-heading">
        <h2 id="tech-capabilities-heading" className="display">
          {title}
        </h2>
        <p>{description}</p>
      </div>

      {/* Part A: Website Types Grid */}
      <div className="tech-types-grid" data-stagger>
        {websiteTypes.map((type) => (
          <div key={type.title} className="tech-type-card">
            <div className="tech-type-header">
              <span className="tech-type-tagline">{type.tagline}</span>
              <h3>{type.title}</h3>
            </div>
            <p className="tech-type-desc">{type.description}</p>
          </div>
        ))}
      </div>

      {/* Part B: Practical Benefits */}
      <div className="tech-benefits-block" data-reveal>
        <div className="tech-benefits-header">
          <h3>Standar pengerjaan yang kami pegang untuk setiap proyek.</h3>
        </div>

        <div className="tech-benefits-grid" data-stagger>
          {practicalBenefits.map((benefit) => (
            <div key={benefit.title} className="tech-benefit-item">
              <IconBadge name={benefit.icon} tone="technology" />
              <div>
                <h4>{benefit.title}</h4>
                <p>{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
