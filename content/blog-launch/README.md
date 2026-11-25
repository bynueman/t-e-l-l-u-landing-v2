# TELLU Blog Launch Editorial Package (`content/blog-launch`)

Paket konten editorial portabel berisi lima artikel perdana TELLU (struktur Tiptap tervalidasi, metadata SEO, serta lima gambar sampul WebP `1600×900`) beserta catatan asal-usul media (`image-manifest.json`).

Paket ini **tidak** menyertakan berkas database SQLite, akun pengguna, hash kata sandi, token sesi, rahasia environment, maupun media privat.

## Struktur Paket

- `manifest.json` — Daftar artikel dan versi paket (`tellu-blog-launch-01`).
- `articles/*.json` — Lima naskah artikel terstruktur (format Tiptap JSON) beserta SEO metadata, tag, dan kategori (`technology`, `creative`, `business`).
- `covers/*.webp` — Lima gambar sampul editorial beresolusi `1600×900` px teroptimasi (< 55 KB per gambar).
- `image-manifest.json` — Manifest asal-usul dan optimasi gambar sampul.

## Cara Impor di Server / VPS (Manual, Idempoten)

1. Pastikan migrasi database CMS sudah berjalan, lalu inisialisasi akun **Owner** terlebih dahulu apabila belum ada akun Owner aktif di VPS (interaktif, tanpa menyimpan kredensial di repositori):

   ```sh
   npm run cms:migrate
   npm run cms:init-owner
   ```

2. Buat cadangan (backup) database & media CMS sebelum melakukan penulisan:

   ```sh
   npm run cms:backup
   ```

3. Jalankan simulasi validasi (`dry-run`) tanpa mengubah database:

   ```sh
   node scripts/cms-import.mjs --dry-run --author-email=<email-owner-aktif>
   ```

4. Impor sebagai `draft` untuk peninjauan aman di `/admin/posts` (slug yang sudah ada otomatis dilewati):

   ```sh
   node scripts/cms-import.mjs --author-email=<email-owner-aktif>
   ```

   Atau terbitkan langsung pada database kosong setelah disetujui Owner:

   ```sh
   node scripts/cms-import.mjs --publish --author-email=<email-owner-aktif>
   ```

5. Jika artikel sudah diimpor sebagai `draft` dan telah ditinjau/disunting di CMS, terbitkan **tanpa** menimpa suntingan Owner (jangan gunakan `--replace` hanya untuk menerbitkan draft):

   ```sh
   node scripts/cms-import.mjs --publish-drafts --author-email=<email-owner-aktif>
   ```

6. Hanya jika perlu memperbarui isi paket artikel yang sudah ada secara sadar, gunakan kedua flag konfirmasi eksplisit berikut:

   ```sh
   node scripts/cms-import.mjs --replace --confirm-replace --publish --author-email=<email-owner-aktif>
   ```
