# TELLU Content & Editorial Standard (`CONTENT.md`)

Dokumen ini menjadi pedoman penulisan konten jangka panjang untuk seluruh halaman publik, mikro-teks antarmuka, metadata SEO, dan artikel Blog TELLU.

---

## 1. Brand Positioning

TELLU adalah digital agency berbasis di Yogyakarta, Indonesia, dengan tiga ekosistem layanan yang saling melengkapi:
- **Technology**: Pembuatan website baru, revamp website lama, penyiapan domain & hosting, serta perawatan website.
- **Creative**: Jasa branding, desain komunikasi visual, produksi konten, dan pengelolaan media sosial.
- **Business**: Software bisnis dan produk SaaS untuk mendukung operasional dan pencatatan usaha (termasuk produk SaaS **Intrax** serta pengembangan sistem bisnis custom).

Komunikasikan TELLU sebagai mitra kerja digital yang profesional, mudah diajak berdiskusi, dan memahami kebutuhan usaha di Indonesia—bukan korporasi multinasional fiktif dan bukan penyedia jasa murah tanpa standar.

---

## 2. Intended Audience

- Pemilik UMKM dan bisnis berkembang di Yogyakarta maupun wilayah lain di Indonesia.
- Perusahaan atau institusi yang membutuhkan company profile, landing page, atau pembaruan website lama.
- Tim usaha yang membutuhkan bantuan merapikan identitas brand, konten, media sosial, atau sistem kerja internal.

---

## 3. Brand Voice & Indonesian Writing Conventions

Karakter suara TELLU: **profesional tanpa kaku, ramah tanpa terlalu santai, percaya diri tanpa melebih-lebihkan, dan teknis secukupnya tanpa jargon berlebih.**

- **Pronomina**: Gunakan **`kamu`** untuk menyapa pengunjung di seluruh halaman publik, dan **`kami`** saat merujuk ke TELLU. Hindari mencampur *kamu*, *Anda*, *kalian*, atau *klien* dalam satu alur kalimat publik. (Catatan: pesan otomatis WhatsApp dari sisi calon pelanggan tetap memakai *"saya"*; panel Admin internal menggunakan bahasa netral dan ringkas).
- **Format mata uang**: Gunakan `Rp` sesuai pemformatan `Intl.NumberFormat("id-ID")` (atau ringkasan wajar seperti `Rp1,5 juta` dalam prosa).
- **Bahasa**: Bahasa Indonesia alami yang langsung menjelaskan layanan dan manfaatnya. Bahasa Inggris hanya dipakai pada nama resmi atau istilah teknis yang memang lazim.

---

## 4. Approved Terminology

Pertahankan penulisan resmi berikut secara konsisten:
- Ekosistem: `Technology`, `Creative`, `Business`
- Navigasi utama: `Beranda`, `Layanan`, `Portfolio`, `Blog`, `Tentang`, `Hubungi Kami`
- Istilah fitur: `Demo Website`, `Smart Search`, `Starter`, `Business`, `Enterprise`, `Custom Solution`
- Kontak terverifikasi (`src/config/site.ts`): `+62 815-8819-099`, `info@tellu.co`, `@tellu.co`, `Yogyakarta, Indonesia`

---

## 5. Human-First & Anti-AI-Slop Principles

1. **Prioritas penulisan**: Pemahaman manusia -> Akurasi bisnis -> Kepercayaan & kegunaan -> Konversi -> Optimasi pencarian.
2. **Konkret sebelum abstrak**: Jelaskan siapa yang membutuhkan layanan, masalah apa yang diselesaikan, apa hasilnya, dan langkah berikutnya.
3. **Pola kalimat yang dilarang saat generik**:
   - *Di era digital yang terus berkembang...*
   - *Solusi inovatif dan komprehensif / end-to-end / seamless / revolusioner*
   - *Membawa bisnis ke level berikutnya / wujudkan potensi maksimal*
   - *Lebih dari sekadar... / website impianmu / partner terpercaya*
   - Pengulangan kata sifat kosong (*profesional, responsif, optimal, modern, berkualitas*) tanpa penjelasan spesifik.
   - Pengulangan struktur 3 slogan paralel atau tanda seru berlebihan.

---

## 6. SEO, AEO & GEO Principles

- **Search Intent Mapping**:
  - `/` (Beranda): Pengenalan TELLU dan pengarah ke layanan melalui Smart Search.
  - `/technology`: Intent komersial jasa pembuatan website, revamp, domain & hosting, perawatan, portfolio, harga, dan estimasi biaya.
  - `/creative`: Intent komersial jasa branding, desain visual, konten, dan pengelolaan media sosial.
  - `/business`: Intent komersial software operasional bisnis dan produk SaaS.
  - `/blog`: Intent informasional dan edukatif.
- **Natural Keyword Integration**: Gunakan kata kunci utama (`jasa pembuatan website`, `jasa pembuatan website profesional`, `jasa revamp website`, `jasa branding`, `social media management`) secara wajar di metadata, heading yang sesuai, dan paragraf layanan tanpa *keyword stuffing* atau daftar kata kunci di footer.
- **AEO & GEO (Answer-First)**: Untuk FAQ dan bagian informasional, berikan jawaban langsung pada kalimat pertama, lanjutkan dengan syarat/batasan yang jujur, lalu arahkan ke tindakan berikutnya. Jangan membuat teks tersembunyi atau instruksi khusus untuk crawler AI.

---

## 7. Factual Claim, Portfolio & Pricing Safeguards

- **Dilarang mengarang**: tahun berdiri, jumlah klien, jumlah proyek selesai, penghargaan, testimoni, alamat kantor jalanan, peringkat Google, jaminan uptime/keamanan 100%, atau produk SaaS yang belum dirilis.
- **Portfolio (`src/lib/technology-portfolio.ts`)**: Hanya tampilkan nama proyek, kategori, URL, tangkapan layar, dan deskripsi faktual. Jangan mengklaim kenaikan trafik, konversi, atau pendapatan. Tandai dengan jelas perbedaan tangkapan layar statis dan `Demo Website` (termasuk status `pending-server-permission` pada Intrax).
- **Harga & Estimator (`src/lib/technology-pricing.ts`)**: Jangan ubah nilai harga atau logika kalkulasi tanpa persetujuan pemilik bisnis. Pertahankan status `draft_pending_business_approval`, pisahkan biaya sekali bayar dan biaya bulanan, dan sertakan disclaimer bahwa angka tersebut adalah estimasi awal sebelum proposal resmi.

---

## 8. CTA Guidelines

Label tombol harus menjelaskan hasil aksi secara spesifik:
- Gunakan: `Lihat Paket Website`, `Hitung Estimasi Biaya`, `Lihat Portfolio`, `Demo Website`, `Buka website asli`, `Konsultasikan Kebutuhanmu`, `Chat WhatsApp`, `Kirim Email`, `Cari layanan`.
- Hindari label kabur seperti `Mulai Sekarang` tanpa tujuan jelas, urgensi palsu, atau diskon buatan.

---

## 9. Blog Editorial Standards

- Blog publik dimulai dalam keadaan kosong tanpa artikel demo hingga pemilik menyetujui artikel nyata.
- Setiap artikel baru wajib:
  1. Menjawab pertanyaan atau kebutuhan pembaca yang nyata dengan *search intent* jelas.
  2. Menggunakan struktur heading (`H2`, `H3`) yang rapi dan contoh praktis.
  3. Menyertakan sumber rujukan kredibel untuk klaim data eksternal.
  4. Menautkan ke halaman layanan TELLU secara alami jika relevan.
  5. Mencantumkan tanggal terbit/pembaruan akurat dan melalui tinjauan Owner/Editor.
- Tidak ada batas minimum jumlah kata; panjang artikel mengikuti kedalaman topik.

---

## 10. Contoh Perbaikan Copy (Sebelum -> Sesudah)

| Bagian | Sebelum (Lemah / Generik) | Sesudah (Jelas & Konkret) |
| --- | --- | --- |
| Hero Description | *Butuh website, konten kreatif, atau solusi digital untuk bisnismu? Temukan layanan yang sesuai dan mulai dari sini.* | *TELLU membantu kamu membangun website profesional, mengembangkan identitas brand, dan menyiapkan sistem digital sesuai kebutuhan bisnismu.* |
| Technology Capabilities | *Lebih dari sekadar website.* | *Jenis website yang dapat dibangun.* |
| Technology CTA | *Mari wujudkan website impianmu.* | *Siap mendiskusikan website bisnismu?* |
| Blog CTA | *Diskusikan kebutuhan website... bisnis Anda bersama tim TELLU.* | *Ceritakan kebutuhan bisnismu bersama tim TELLU untuk menentukan langkah pengerjaan yang paling sesuai.* |
