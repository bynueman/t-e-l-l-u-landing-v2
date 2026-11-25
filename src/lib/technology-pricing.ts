/**
 * TELLU Technology — Centralized Pricing & Cost Estimator Registry
 *
 * NOTE: All prices, deliverables, and conditions here originate from the historical
 * YUKWebsite.online reference offering and represent local draft business data.
 * Commercial approval from TELLU leadership is required before entering binding contracts.
 */

export type PricingStatus = "draft_pending_business_approval" | "approved";

export interface PricingFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

export interface WebsitePackage {
  id: "starter" | "business" | "enterprise";
  category: "baru";
  name: string;
  tagline: string;
  targetAudience: string;
  startingPrice: number;
  priceLabel: string;
  note: string;
  popular?: boolean;
  status: PricingStatus;
  revisions: string;
  deliveryTimeEstimate: string;
  features: PricingFeature[];
  includedAddonIds: string[];
}

export interface RevampPackage {
  id: "revamp-lite" | "revamp-pro" | "revamp-enterprise";
  category: "revamp";
  name: string;
  tagline: string;
  startingPrice: number;
  priceLabel: string;
  status: PricingStatus;
  popular?: boolean;
  features: PricingFeature[];
}

export interface ServiceOffering {
  id: "web-development" | "website-revamp" | "domain" | "maintenance";
  anchor: string;
  title: string;
  tagline: string;
  startingPrice: number | null;
  priceDisplay: string;
  billingPeriod?: "one-time" | "monthly" | "consultation";
  status: PricingStatus;
  deliverables: string[];
}

export interface EstimatorPageTier {
  id: string;
  label: string;
  description: string;
  price: number;
  inherentAddonIds?: string[];
}

export interface EstimatorAddon {
  id: string;
  label: string;
  description?: string;
  price: number;
  onlyFor?: "baru" | "revamp";
  isRecurringMonthly?: boolean;
}

export const PRICING_DISCLAIMER =
  "Draft referensi lokal. Estimasi awal; harga final disesuaikan dengan kebutuhan dan ruang lingkup proyek.";

export const ESTIMATOR_DISCLAIMER =
  "Estimasi awal bersifat indikatif. Harga dan lingkup final disepakati bersama dalam proposal resmi sebelum pengerjaan dimulai.";

/**
 * Currency formatter for Indonesian Rupiah (IDR).
 * Uses standard non-breaking spacing and zero decimals.
 */
export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Four core services offered under TELLU Technology.
 */
export const technologyServices: readonly ServiceOffering[] = [
  {
    id: "web-development",
    anchor: "web-development",
    title: "Pembuatan Website Baru",
    tagline: "Website baru dengan desain custom dan struktur SEO sejak awal.",
    startingPrice: 1_500_000,
    priceDisplay: "Mulai Rp1,5 Juta",
    billingPeriod: "one-time",
    status: "draft_pending_business_approval",
    deliverables: [
      "Landing page promosi atau profil bisnis satu hingga multi-halaman",
      "Desain custom responsif dari layar ponsel hingga desktop",
      "Integrasi formulir kontak & tombol WhatsApp",
      "Struktur SEO on-page & Open Graph dasar",
      "Bantuan domain, hosting & SSL tahun pertama",
    ],
  },
  {
    id: "website-revamp",
    anchor: "website-revamp",
    title: "Revamp Website",
    tagline: "Perbarui website lama agar lebih cepat, rapi di ponsel, dan mudah dikelola.",
    startingPrice: 2_500_000,
    priceDisplay: "Mulai Rp2,5 Juta",
    billingPeriod: "one-time",
    status: "draft_pending_business_approval",
    deliverables: [
      "Peninjauan antarmuka UI/UX dan alur halaman",
      "Perbaikan kecepatan muat & tampilan di ponsel",
      "Migrasi konten yang masih relevan ke struktur baru",
      "Pengaturan 301 redirect agar tautan lama tetap bekerja",
      "Pembaruan kode ke stack web yang lebih rapi",
    ],
  },
  {
    id: "domain",
    anchor: "domain",
    title: "Domain & Hosting",
    tagline: "Penyiapan alamat domain, hosting, konfigurasi DNS, dan sertifikat SSL.",
    startingPrice: null,
    priceDisplay: "Konsultasi Kebutuhan",
    billingPeriod: "consultation",
    status: "draft_pending_business_approval",
    deliverables: [
      "Bantuan pemilihan & pendaftaran ekstensi domain (.id, .com, dll.)",
      "Konfigurasi DNS & nameserver agar domain terhubung ke server",
      "Setup hosting sesuai kebutuhan trafik website",
      "Pemasangan sertifikat SSL (HTTPS)",
      "Pendampingan perpanjangan domain & migrasi server",
    ],
  },
  {
    id: "maintenance",
    anchor: "maintenance",
    title: "Perawatan Website",
    tagline: "Pembaruan konten berkala, backup rutin, dan dukungan teknis sesuai kesepakatan.",
    startingPrice: 500_000,
    priceDisplay: "Mulai Rp500rb / bln",
    billingPeriod: "monthly",
    status: "draft_pending_business_approval",
    deliverables: [
      "Pembaruan konten & teks berkala sesuai kuota",
      "Pemeriksaan keamanan dasar & pembaruan dependensi",
      "Pencadangan (backup) otomatis terjadwal",
      "Pemantauan kondisi akses & kecepatan halaman",
      "Bantuan konsultasi teknis & perbaikan kendala ringan",
    ],
  },
] as const;

/**
 * Website Baru package plans (Starter, Business, Enterprise).
 */
export const websiteBaruPackages: readonly WebsitePackage[] = [
  {
    id: "starter",
    category: "baru",
    name: "Starter",
    tagline: "Untuk personal brand, landing page promosi, atau UMKM yang butuh satu halaman ringkas.",
    targetAudience: "UMKM & Personal Brand",
    startingPrice: 1_500_000,
    priceLabel: "Rp1.500.000",
    note: "1 Halaman Landing Page",
    popular: false,
    status: "draft_pending_business_approval",
    revisions: "1x revisi mayor dalam lingkup desain awal",
    deliveryTimeEstimate: "2 - 5 hari kerja",
    includedAddonIds: [],
    features: [
      { text: "1 Halaman Landing Page responsif", included: true },
      { text: "Desain custom menyesuaikan profil usaha", included: true },
      { text: "Tampilan rapi di ponsel, tablet, dan desktop", included: true },
      { text: "Integrasi tombol WhatsApp & formulir kontak", included: true },
      { text: "Struktur SEO on-page dasar & Open Graph", included: true },
      { text: "Bantuan domain (.com / .id) 1 tahun", included: true },
      { text: "Hosting standar 1 tahun & sertifikat SSL", included: true },
      { text: "CMS panel admin mandiri", included: false },
      { text: "Fitur e-commerce / sistem booking", included: false },
    ],
  },
  {
    id: "business",
    category: "baru",
    name: "Business",
    tagline: "Untuk company profile multi-halaman dengan struktur lengkap dan panel admin CMS.",
    targetAudience: "Bisnis Berkembang & Company Profile",
    startingPrice: 3_500_000,
    priceLabel: "Rp3.500.000",
    note: "5 - 7 Halaman dengan CMS",
    popular: true,
    status: "draft_pending_business_approval",
    revisions: "3x revisi terarah sesuai rancangan awal",
    deliveryTimeEstimate: "5 - 10 hari kerja",
    includedAddonIds: ["cms", "maps", "social", "seo-advanced"],
    features: [
      { text: "5 - 7 Halaman terstruktur (Beranda, Layanan, Tentang, Kontak, dsb.)", included: true, highlight: true },
      { text: "Desain custom menyesuaikan identitas bisnis", included: true },
      { text: "Panel CMS untuk kelola konten mandiri", included: true, highlight: true },
      { text: "Pengaturan SEO lanjutan & peta situs XML", included: true },
      { text: "Integrasi peta Google Maps & tautan media sosial", included: true },
      { text: "Bantuan domain (.com / .id) 1 tahun", included: true },
      { text: "Hosting 1 tahun & sertifikat SSL", included: true },
      { text: "Panduan pemakaian CMS", included: true },
      { text: "Sistem e-commerce / transaksi online", included: false },
    ],
  },
  {
    id: "enterprise",
    category: "baru",
    name: "Enterprise",
    tagline: "Untuk website dengan fitur khusus, katalog e-commerce, booking, atau integrasi sistem.",
    targetAudience: "Perusahaan & Sistem Kustom",
    startingPrice: 7_500_000,
    priceLabel: "Mulai Rp7.500.000",
    note: "Multi Halaman & Sistem Kustom",
    popular: false,
    status: "draft_pending_business_approval",
    revisions: "Pendampingan revisi intensif sesuai milestone proposal",
    deliveryTimeEstimate: "14 - 30 hari kerja",
    includedAddonIds: ["cms", "maps", "social", "seo-advanced", "ecommerce", "payment"],
    features: [
      { text: "Arsitektur halaman dinamis sesuai kebutuhan proyek", included: true, highlight: true },
      { text: "Desain antarmuka custom mengikuti panduan brand", included: true },
      { text: "CMS atau struktur basis data sesuai kebutuhan proyek", included: true },
      { text: "Fitur e-commerce atau booking system (sesuai kesepakatan proposal)", included: true, highlight: true },
      { text: "Integrasi payment gateway (jika tercakup di proposal)", included: true },
      { text: "Pengaturan performa & keamanan sesuai kompleksitas sistem", included: true },
      { text: "Prioritas asistensi teknis pada bulan pertama", included: true },
      { text: "Serah terima dokumentasi teknis & akses penuh", included: true },
    ],
  },
] as const;

/**
 * Revamp Website package tiers.
 */
export const revampPackages: readonly RevampPackage[] = [
  {
    id: "revamp-lite",
    category: "revamp",
    name: "Revamp Lite",
    tagline: "Penyegaran tampilan antarmuka dan perbaikan agar nyaman diakses di ponsel.",
    startingPrice: 2_500_000,
    priceLabel: "Rp2.500.000",
    popular: false,
    status: "draft_pending_business_approval",
    features: [
      { text: "Desain ulang tampilan agar lebih rapi", included: true },
      { text: "Perbaikan kecepatan muat dan tampilan ponsel/tablet", included: true },
      { text: "Migrasi konten lama ke struktur baru", included: true },
      { text: "Pengecekan tautan dasar agar link lama tetap bekerja", included: true },
      { text: "Pembaruan sertifikat SSL & keamanan dasar", included: true },
    ],
  },
  {
    id: "revamp-pro",
    category: "revamp",
    name: "Revamp Pro",
    tagline: "Pembangunan ulang tampilan dan kode dengan framework modern serta panel admin CMS.",
    startingPrice: 5_000_000,
    priceLabel: "Rp5.000.000",
    popular: true,
    status: "draft_pending_business_approval",
    features: [
      { text: "Desain ulang menyeluruh mengikuti identitas brand terbaru", included: true },
      { text: "Pembangunan ulang dengan framework modern (Next.js/React)", included: true },
      { text: "Migrasi basis data dan konten yang masih relevan", included: true },
      { text: "Penyediaan panel CMS mandiri untuk tim", included: true },
      { text: "Penataan kecepatan & pengalihan URL 301 redirect", included: true },
      { text: "1 bulan masa pendampingan pasca peluncuran", included: true },
    ],
  },
  {
    id: "revamp-enterprise",
    category: "revamp",
    name: "Revamp Enterprise",
    tagline: "Pembaruan menyeluruh untuk website dengan basis data besar, fitur khusus, atau integrasi API.",
    startingPrice: 10_000_000,
    priceLabel: "Mulai Rp10.000.000",
    popular: false,
    status: "draft_pending_business_approval",
    features: [
      { text: "Pembangunan ulang arsitektur sistem secara menyeluruh", included: true },
      { text: "Pengembangan fitur kustom & integrasi API pihak ketiga", included: true },
      { text: "Penataan ulang struktur basis data", included: true },
      { text: "Peninjauan keamanan & penyesuaian konfigurasi server", included: true },
      { text: "3 bulan masa pemeliharaan & pemantauan berkala", included: true },
    ],
  },
] as const;

/**
 * Feature comparison matrix for Website Baru packages.
 */
export interface ComparisonFeatureRow {
  category: string;
  name: string;
  starter: string | boolean;
  business: string | boolean;
  enterprise: string | boolean;
}

export const packageComparisonRows: readonly ComparisonFeatureRow[] = [
  { category: "Halaman & Desain", name: "Jumlah Halaman", starter: "1 Halaman (Landing)", business: "5 - 7 Halaman", enterprise: "Kustom / Sesuai Kebutuhan" },
  { category: "Halaman & Desain", name: "Desain Antarmuka", starter: "Custom Ringkas", business: "Custom Bisnis", enterprise: "Custom Menyeluruh" },
  { category: "Halaman & Desain", name: "Mobile Responsive", starter: true, business: true, enterprise: true },
  { category: "Fitur & Pengelolaan", name: "Panel Admin (CMS)", starter: false, business: true, enterprise: true },
  { category: "Fitur & Pengelolaan", name: "Formulir / WhatsApp", starter: true, business: true, enterprise: true },
  { category: "Fitur & Pengelolaan", name: "Google Maps & Sosmed", starter: "Tautan Sosmed", business: "Maps + Sosmed Lengkap", enterprise: "Integrasi Lanjutan" },
  { category: "Fitur & Pengelolaan", name: "E-Commerce / Booking", starter: false, business: false, enterprise: "Tersedia (Sesuai Proposal)" },
  { category: "Infrastruktur", name: "Domain .com / .id (1 Thn)", starter: true, business: true, enterprise: true },
  { category: "Infrastruktur", name: "Hosting & SSL (1 Thn)", starter: "1 GB Standar", business: "5 GB Menengah", enterprise: "Kapasitas Disesuaikan" },
  { category: "SEO & Performa", name: "Struktur SEO", starter: "On-page Dasar", business: "SEO Lanjutan + Sitemap", enterprise: "Penyesuaian Menyeluruh" },
  { category: "Dukungan", name: "Batas Revisi", starter: "1x Mayor", business: "3x Mayor", enterprise: "Sesuai Milestone Proyek" },
  { category: "Dukungan", name: "Panduan Pemakaian", starter: "Panduan Singkat", business: "Buku Panduan + Video", enterprise: "Pendampingan & Dokumentasi" },
];

/**
 * Estimator configuration.
 */
export const estimatorConfig = {
  basePrices: {
    baru: 1_500_000,
    revamp: 2_500_000,
  },
  baseDescriptions: {
    baru: "Termasuk: 1 halaman landing page, desain custom mobile-first, integrasi WhatsApp/kontak, fondasi SEO, domain & hosting 1 tahun.",
    revamp: "Termasuk: Redesign antarmuka, perbaikan kecepatan muat, migrasi konten, penataan responsivitas, dan pengecekan keamanan dasar.",
  },
  tierQuestions: {
    baru: "Berapa banyak halaman yang kamu butuhkan?",
    revamp: "Seberapa besar cakupan pembaruan website lama?",
  },
  pageTiers: {
    baru: [
      { id: "baru-1", label: "1 Halaman (Landing Page)", description: "Cocok untuk promosi satu layanan atau profil usaha ringkas.", price: 0 },
      { id: "baru-2-4", label: "2 - 4 Halaman", description: "Beranda, Layanan, Tentang Kami, dan Kontak.", price: 750_000 },
      { id: "baru-5-7", label: "5 - 7 Halaman (Paket Business)", description: "Struktur lengkap untuk company profile bisnis.", price: 1_500_000, inherentAddonIds: ["cms", "maps", "social"] },
      { id: "baru-custom", label: "Multi-Halaman Kustom (>7 Halaman)", description: "Struktur halaman fleksibel sesuai kebutuhan kompleks.", price: 2_500_000, inherentAddonIds: ["cms"] },
    ] as EstimatorPageTier[],
    revamp: [
      { id: "revamp-refresh", label: "Penyegaran Tampilan Saja (Lite)", description: "Pembaruan antarmuka dan perapian tampilan ponsel.", price: 0 },
      { id: "revamp-rebuild", label: "Pembangunan Ulang Total (Pro)", description: "Penggantian teknologi ke framework modern + panel CMS.", price: 2_500_000, inherentAddonIds: ["cms"] },
      { id: "revamp-transform", label: "Pembaruan Sistem Menyeluruh (Enterprise)", description: "Penataan ulang struktur sistem, basis data, dan fitur khusus.", price: 7_500_000, inherentAddonIds: ["cms", "db-migration"] },
    ] as EstimatorPageTier[],
  },
  addons: [
    { id: "cms", label: "Panel Admin (CMS)", description: "Kelola dan perbarui teks atau gambar website secara mandiri melalui panel admin", price: 500_000, onlyFor: "baru" },
    { id: "seo-advanced", label: "Optimasi SEO Lanjutan", description: "Penataan struktur metadata, schema dasar, dan peta situs XML untuk mesin pencari", price: 250_000 },
    { id: "maps", label: "Integrasi Google Maps Interaktif", description: "Tampilkan peta lokasi usaha agar pengunjung mudah menemukan alamatmu", price: 150_000, onlyFor: "baru" },
    { id: "social", label: "Integrasi Umpan Media Sosial", description: "Menghubungkan tautan profil dan tampilan media sosial di halaman website", price: 150_000, onlyFor: "baru" },
    { id: "ecommerce", label: "Modul Katalog E-Commerce / Booking", description: "Daftar produk, keranjang belanja, atau formulir pemesanan jadwal online", price: 2_500_000, onlyFor: "baru" },
    { id: "payment", label: "Integrasi Gerbang Pembayaran (Payment Gateway)", description: "Terima pembayaran online melalui metode yang disepakati (mis. Midtrans atau Xendit)", price: 750_000, onlyFor: "baru" },
    { id: "db-migration", label: "Migrasi & Penataan Basis Data", description: "Pemindahan data dari sistem lama ke struktur baru dengan rapi", price: 750_000, onlyFor: "revamp" },
    { id: "custom-features", label: "Pengembangan Fitur Kustom", description: "Penambahan fungsi khusus di luar fitur standar sesuai alur kerja bisnismu", price: 1_500_000, onlyFor: "revamp" },
    { id: "api-integration", label: "Integrasi API Eksternal", description: "Menghubungkan website dengan layanan atau software lain yang sudah digunakan", price: 1_000_000, onlyFor: "revamp" },
    { id: "priority-support", label: "Perawatan & Monitoring Bulanan", description: "Pembaruan konten berkala, backup rutin, dan pemantauan teknis (tagihan per bulan)", price: 500_000, isRecurringMonthly: true },
  ] as EstimatorAddon[],
} as const;

/**
 * Calculates website project estimate with deduplication and recurring cost isolation.
 */
export function calculateProjectEstimate(params: {
  category: "baru" | "revamp";
  tierId: string;
  selectedAddonIds: string[];
}): {
  category: "baru" | "revamp";
  basePrice: number;
  tierId: string;
  tierLabel: string;
  tierPrice: number;
  selectedAddons: { id: string; label: string; price: number; isRecurringMonthly?: boolean }[];
  deduplicatedAddonLabels: string[];
  oneTimeTotal: number;
  monthlyTotal: number;
  formattedOneTimeTotal: string;
  formattedMonthlyTotal: string;
  disclaimer: string;
} {
  const { category, tierId, selectedAddonIds } = params;
  const basePrice = estimatorConfig.basePrices[category] ?? 1_500_000;
  const tiers = estimatorConfig.pageTiers[category];
  const selectedTier = tiers.find((t) => t.id === tierId) ?? tiers[0];
  const tierPrice = selectedTier.price;

  const inherentAddonIds = new Set(selectedTier.inherentAddonIds ?? []);

  // Filter addons relevant to this category
  const availableAddons = estimatorConfig.addons.filter(
    (addon) => !addon.onlyFor || addon.onlyFor === category
  );

  let oneTimeAddonsTotal = 0;
  let monthlyTotal = 0;
  const selectedAddonsList: { id: string; label: string; price: number; isRecurringMonthly?: boolean }[] = [];
  const deduplicatedAddonLabels: string[] = [];

  for (const addonId of selectedAddonIds) {
    const addon = availableAddons.find((a) => a.id === addonId);
    if (!addon) continue;

    // Deduplication check: If this addon is already covered by the tier, do not charge twice!
    if (inherentAddonIds.has(addon.id)) {
      deduplicatedAddonLabels.push(addon.label);
      selectedAddonsList.push({
        id: addon.id,
        label: `${addon.label} (Sudah termasuk dalam paket)`,
        price: 0,
        isRecurringMonthly: addon.isRecurringMonthly,
      });
      continue;
    }

    if (addon.isRecurringMonthly) {
      monthlyTotal += addon.price;
      selectedAddonsList.push({
        id: addon.id,
        label: addon.label,
        price: addon.price,
        isRecurringMonthly: true,
      });
    } else {
      oneTimeAddonsTotal += addon.price;
      selectedAddonsList.push({
        id: addon.id,
        label: addon.label,
        price: addon.price,
        isRecurringMonthly: false,
      });
    }
  }

  const oneTimeTotal = basePrice + tierPrice + oneTimeAddonsTotal;

  return {
    category,
    basePrice,
    tierId: selectedTier.id,
    tierLabel: selectedTier.label,
    tierPrice,
    selectedAddons: selectedAddonsList,
    deduplicatedAddonLabels,
    oneTimeTotal,
    monthlyTotal,
    formattedOneTimeTotal: formatRupiah(oneTimeTotal),
    formattedMonthlyTotal: formatRupiah(monthlyTotal),
    disclaimer: ESTIMATOR_DISCLAIMER,
  };
}

/**
 * Builds a friendly summary message for WhatsApp or inquiry consultation.
 */
export function buildConsultationInquiryMessage(estimate: ReturnType<typeof calculateProjectEstimate>): string {
  const categoryName = estimate.category === "baru" ? "Pembuatan Website Baru" : "Revamp Website";
  const lines: string[] = [
    `Halo tim TELLU Technology, saya ingin berkonsultasi mengenai ${categoryName}.`,
    `Lingkup yang saya pilih: ${estimate.tierLabel}`,
  ];

  if (estimate.selectedAddons.length > 0) {
    const addonNames = estimate.selectedAddons.map((a) => a.label).join(", ");
    lines.push(`Fitur tambahan: ${addonNames}`);
  }

  lines.push(`Estimasi kalkulator: ${estimate.formattedOneTimeTotal}${estimate.monthlyTotal > 0 ? ` + ${estimate.formattedMonthlyTotal}/bln` : ""}.`);
  lines.push(`Mohon informasi penawaran dan jadwal konsultasi lebih lanjut.`);

  return lines.join("\n");
}
