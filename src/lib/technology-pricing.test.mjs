import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatRupiah,
  technologyServices,
  websiteBaruPackages,
  revampPackages,
  packageComparisonRows,
  calculateProjectEstimate,
  buildConsultationInquiryMessage,
  PRICING_DISCLAIMER,
  ESTIMATOR_DISCLAIMER,
} from "./technology-pricing.ts";

test("formatRupiah formats IDR currency correctly", () => {
  const formatted = formatRupiah(1_500_000);
  assert.ok(formatted.includes("1.500.000"), formatted);
  assert.ok(formatted.includes("Rp"), formatted);
});

test("pricing registry marks all draft items with approval status and disclaimer", () => {
  assert.ok(PRICING_DISCLAIMER.includes("Draft referensi lokal"));
  assert.ok(ESTIMATOR_DISCLAIMER.includes("Estimasi awal bersifat indikatif"));

  for (const service of technologyServices) {
    assert.equal(service.status, "draft_pending_business_approval");
    assert.ok(service.deliverables.length >= 3);
  }

  for (const pkg of websiteBaruPackages) {
    assert.equal(pkg.status, "draft_pending_business_approval");
    assert.ok(pkg.startingPrice >= 1_500_000);
    assert.ok(pkg.features.length >= 5);
  }

  for (const pkg of revampPackages) {
    assert.equal(pkg.status, "draft_pending_business_approval");
    assert.ok(pkg.startingPrice >= 2_500_000);
    assert.ok(pkg.features.length >= 4);
  }
});

test("websiteBaruPackages contain correct baseline Starter, Business, and Enterprise plans", () => {
  assert.equal(websiteBaruPackages.length, 3);
  const [starter, business, enterprise] = websiteBaruPackages;

  assert.equal(starter.id, "starter");
  assert.equal(starter.startingPrice, 1_500_000);

  assert.equal(business.id, "business");
  assert.equal(business.startingPrice, 3_500_000);
  assert.equal(business.popular, true);

  assert.equal(enterprise.id, "enterprise");
  assert.equal(enterprise.startingPrice, 7_500_000);

  assert.ok(packageComparisonRows.length >= 8);
});

test("calculateProjectEstimate handles base calculation for Website Baru", () => {
  const result = calculateProjectEstimate({
    category: "baru",
    tierId: "baru-1",
    selectedAddonIds: [],
  });

  assert.equal(result.category, "baru");
  assert.equal(result.basePrice, 1_500_000);
  assert.equal(result.tierPrice, 0);
  assert.equal(result.oneTimeTotal, 1_500_000);
  assert.equal(result.monthlyTotal, 0);
  assert.equal(result.deduplicatedAddonLabels.length, 0);
});

test("calculateProjectEstimate handles base calculation for Revamp Website", () => {
  const result = calculateProjectEstimate({
    category: "revamp",
    tierId: "revamp-refresh",
    selectedAddonIds: [],
  });

  assert.equal(result.category, "revamp");
  assert.equal(result.basePrice, 2_500_000);
  assert.equal(result.tierPrice, 0);
  assert.equal(result.oneTimeTotal, 2_500_000);
});

test("calculateProjectEstimate correctly deduplicates addons already covered by selected tier", () => {
  // 'baru-5-7' tier has inherentAddonIds: ["cms", "maps", "social"]
  const result = calculateProjectEstimate({
    category: "baru",
    tierId: "baru-5-7",
    selectedAddonIds: ["cms", "maps", "seo-advanced"],
  });

  // Base 1.5M + tier 1.5M = 3.0M
  // cms and maps are deduplicated (price 0)
  // seo-advanced is 250_000
  // Total = 3_250_000
  assert.equal(result.tierPrice, 1_500_000);
  assert.equal(result.deduplicatedAddonLabels.length, 2);
  assert.ok(result.deduplicatedAddonLabels.includes("Panel Admin (CMS)"));
  assert.ok(result.deduplicatedAddonLabels.includes("Integrasi Google Maps Interaktif"));

  const cmsItem = result.selectedAddons.find((a) => a.id === "cms");
  assert.ok(cmsItem);
  assert.equal(cmsItem.price, 0);
  assert.ok(cmsItem.label.includes("Sudah termasuk dalam paket"));

  assert.equal(result.oneTimeTotal, 1_500_000 + 1_500_000 + 250_000);
});

test("calculateProjectEstimate separates recurring monthly costs from one-time investment", () => {
  const result = calculateProjectEstimate({
    category: "baru",
    tierId: "baru-1",
    selectedAddonIds: ["priority-support"],
  });

  assert.equal(result.oneTimeTotal, 1_500_000);
  assert.equal(result.monthlyTotal, 500_000);
  assert.ok(result.formattedMonthlyTotal.includes("500.000"));
});

test("calculateProjectEstimate ignores addons not applicable to active category", () => {
  // 'ecommerce' has onlyFor: "baru"
  const result = calculateProjectEstimate({
    category: "revamp",
    tierId: "revamp-refresh",
    selectedAddonIds: ["ecommerce"],
  });

  assert.equal(result.oneTimeTotal, 2_500_000);
  assert.equal(result.selectedAddons.length, 0);
});

test("buildConsultationInquiryMessage produces a well-formed consultation string", () => {
  const result = calculateProjectEstimate({
    category: "baru",
    tierId: "baru-2-4",
    selectedAddonIds: ["seo-advanced"],
  });

  const message = buildConsultationInquiryMessage(result);
  assert.ok(message.includes("Pembuatan Website Baru"));
  assert.ok(message.includes("2 - 4 Halaman"));
  assert.ok(message.includes("Optimasi SEO Lanjutan"));
  assert.ok(message.includes("Estimasi kalkulator:"));
});
