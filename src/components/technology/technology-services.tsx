import { Icon, IconBadge } from "@/components/ui/icon";

interface TechnologyServicesProps {
  title?: string;
  description?: string;
}

export function TechnologyServices({
  title = "Layanan pembuatan, pembaruan, hingga perawatan website.",
  description = "Pilih layanan sesuai kondisi website bisnismu saat ini, mulai dari membuat dari nol hingga merawat website yang sudah berjalan.",
}: TechnologyServicesProps) {
  return (
    <section id="explore" className="tech-services-section page-container section-space" aria-labelledby="tech-services-heading">
      <div data-reveal className="tech-section-heading">
        <h2 id="tech-services-heading" className="display">
          {title}
        </h2>
        <p>{description}</p>
      </div>

      <div className="tech-bento-grid">
        {/* Card 1: Pembuatan Website Baru */}
        <article id="web-development" className="tech-bento-card tech-bento-featured" data-reveal>
          <div className="tech-bento-card-header">
            <IconBadge name="browser" tone="technology" />
            <span className="tech-bento-price">Mulai Rp1.500.000*</span>
          </div>

          <div className="tech-bento-body">
            <h3>Pembuatan Website Baru</h3>
            <p className="tech-bento-lead">
              Untuk bisnis yang belum memiliki website atau membutuhkan halaman khusus promosi. Dirancang agar informasi usaha, layanan, dan tombol kontak mudah diakses calon pelanggan.
            </p>

            <ul className="tech-deliverables-list">
              <li>Landing page promosi atau company profile multi-halaman</li>
              <li>Tampilan menyesuaikan layar ponsel, tablet, dan desktop</li>
              <li>Integrasi tombol WhatsApp dan formulir kontak</li>
              <li>Struktur halaman ramah mesin pencari (on-page SEO &amp; Open Graph)</li>
              <li>Pendampingan setup domain, hosting, dan SSL tahun pertama</li>
            </ul>
          </div>

          <div className="tech-bento-footer">
            <a href="#packages" className="button-primary text-sm inline-flex items-center gap-1.5">
              <span>Lihat Paket Website</span>
              <Icon name="layers" size={16} />
            </a>
            <a href="#estimator" className="text-link inline-flex items-center gap-1.5">
              <span>Hitung Estimasi Biaya</span>
              <Icon name="calculator" size={16} />
            </a>
          </div>
        </article>

        {/* Card 2: Revamp Website */}
        <article id="website-revamp" className="tech-bento-card tech-bento-revamp" data-reveal>
          <div className="tech-bento-card-header">
            <IconBadge name="refresh" tone="technology" />
            <span className="tech-bento-price">Mulai Rp2.500.000*</span>
          </div>

          <div className="tech-bento-body">
            <h3>Revamp Website Lama</h3>
            <p className="tech-bento-lead">
              Untuk website lama yang tampilannya sudah tertinggal, berat diakses dari ponsel, atau sulit dikelola. Kami benahi tampilan dan kodenya tanpa menghilangkan konten yang sudah ada.
            </p>

            <ul className="tech-deliverables-list">
              <li>Peninjauan tampilan, kecepatan muat, dan alur informasi</li>
              <li>Pemindahan konten yang masih relevan ke struktur baru</li>
              <li>Pengaturan 301 redirect agar tautan lama tetap terarah</li>
              <li>Perbaikan responsivitas layar dan pembaruan basis kode</li>
            </ul>
          </div>

          <div className="tech-bento-footer">
            <a href="#packages" className="button-outline text-sm inline-flex items-center gap-1.5">
              <span>Lihat Paket Revamp</span>
              <Icon name="refresh" size={16} />
            </a>
            <a href="#contact" className="text-link inline-flex items-center gap-1.5">
              <span>Konsultasi Revamp</span>
              <Icon name="clipboard" size={16} />
            </a>
          </div>
        </article>

        {/* Card 3: Domain & Hosting */}
        <article id="domain" className="tech-bento-card" data-reveal>
          <div className="tech-bento-card-header">
            <IconBadge name="globe" tone="technology" />
            <span className="tech-bento-price">Konsultasi</span>
          </div>

          <div className="tech-bento-body">
            <h3>Domain &amp; Hosting</h3>
            <p className="tech-bento-lead">
              Website membutuhkan alamat domain dan ruang server agar bisa diakses online. Kami bantu memilih nama domain, mengatur DNS, memasang sertifikat SSL, hingga proses penayangan.
            </p>

            <ul className="tech-deliverables-list">
              <li>Bantuan pemilihan dan pendaftaran domain (.com, .id, dan lainnya)</li>
              <li>Konfigurasi DNS dan nameserver agar domain terhubung ke server</li>
              <li>Penyiapan hosting dan sertifikat keamanan SSL (HTTPS)</li>
              <li>Pendampingan perpanjangan domain atau migrasi hosting</li>
            </ul>
          </div>

          <div className="tech-bento-footer">
            <a href="#contact" className="button-outline text-sm inline-flex items-center gap-1.5">
              <span>Konsultasi Domain &amp; Hosting</span>
              <Icon name="globe" size={16} />
            </a>
          </div>
        </article>

        {/* Card 4: Perawatan Website (Maintenance) */}
        <article id="maintenance" className="tech-bento-card" data-reveal>
          <div className="tech-bento-card-header">
            <IconBadge name="wrench" tone="technology" />
            <span className="tech-bento-price">Mulai Rp500rb / bln*</span>
          </div>

          <div className="tech-bento-body">
            <h3>Perawatan Website</h3>
            <p className="tech-bento-lead">
              Untuk website yang sudah tayang dan perlu diperbarui secara berkala. Cakupan kerja meliputi pembaruan konten, backup terjadwal, dan dukungan teknis sesuai kesepakatan.
            </p>

            <ul className="tech-deliverables-list">
              <li>Pembaruan teks, gambar, atau halaman sesuai kuota yang disepakati</li>
              <li>Pencadangan (backup) data website secara berkala</li>
              <li>Pemantauan kondisi akses dan pembaruan komponen teknis</li>
              <li>Penanganan kendala teknis ringan sesuai cakupan layanan</li>
            </ul>
          </div>

          <div className="tech-bento-footer">
            <a href="#faq" className="button-outline text-sm inline-flex items-center gap-1.5">
              <span>Lihat Cakupan di FAQ</span>
              <Icon name="wrench" size={16} />
            </a>
          </div>
        </article>
      </div>

      <p className="tech-services-footnote text-muted text-xs mt-6">
        *Seluruh harga merupakan draft referensi awal. Biaya definitif dikonfirmasi melalui proposal resmi sesuai lingkup proyek yang disepakati.
      </p>
    </section>
  );
}
