import assert from "node:assert/strict";
import { test } from "node:test";
import {
  estimatorConfig,
  calculateProjectEstimate,
  buildConsultationInquiryMessage,
} from "./technology-pricing.ts";

test("all estimator addons have a defined valid semantic icon mapping", () => {
  const supportedIcons = [
    "code",
    "sparkles",
    "map-pin",
    "share",
    "cart",
    "credit-card",
    "database",
    "app",
    "globe",
    "wrench",
  ];

  const addonIconMap = {
    cms: "code",
    "seo-advanced": "sparkles",
    maps: "map-pin",
    social: "share",
    ecommerce: "cart",
    payment: "credit-card",
    "db-migration": "database",
    "custom-features": "app",
    "api-integration": "globe",
    "priority-support": "wrench",
  };

  for (const addon of estimatorConfig.addons) {
    const icon = addonIconMap[addon.id];
    assert.ok(icon, `Addon ${addon.id} must have an icon`);
    assert.ok(supportedIcons.includes(icon), `Icon ${icon} must be supported`);
  }
});

test("initial estimator state renders base Rp1.500.000 with 0 recurring", () => {
  const estimate = calculateProjectEstimate({
    category: "baru",
    tierId: "baru-1",
    selectedAddonIds: [],
  });

  assert.equal(estimate.oneTimeTotal, 1_500_000);
  assert.equal(estimate.monthlyTotal, 0);
  assert.equal(estimate.formattedOneTimeTotal, "Rp\u00a01.500.000");
  assert.equal(estimate.selectedAddons.length, 0);
});

test("revamp initial state renders base Rp2.500.000 with 0 recurring", () => {
  const estimate = calculateProjectEstimate({
    category: "revamp",
    tierId: "revamp-refresh",
    selectedAddonIds: [],
  });

  assert.equal(estimate.oneTimeTotal, 2_500_000);
  assert.equal(estimate.monthlyTotal, 0);
  assert.equal(estimate.formattedOneTimeTotal, "Rp\u00a02.500.000");
});

test("selecting recurring addon separates monthly maintenance from one-time total", () => {
  const estimate = calculateProjectEstimate({
    category: "baru",
    tierId: "baru-1",
    selectedAddonIds: ["priority-support"],
  });

  assert.equal(estimate.oneTimeTotal, 1_500_000);
  assert.equal(estimate.monthlyTotal, 500_000);
  assert.equal(estimate.formattedMonthlyTotal, "Rp\u00a0500.000");

  const message = buildConsultationInquiryMessage(estimate);
  assert.ok(message.includes(`${estimate.formattedMonthlyTotal}/bln`));
});

test("inherent addons in Business tier (5-7 pages) are not charged extra", () => {
  const estimateWithInherent = calculateProjectEstimate({
    category: "baru",
    tierId: "baru-5-7",
    selectedAddonIds: ["cms", "maps", "social"],
  });

  const estimateWithoutExplicit = calculateProjectEstimate({
    category: "baru",
    tierId: "baru-5-7",
    selectedAddonIds: [],
  });

  assert.equal(estimateWithInherent.oneTimeTotal, estimateWithoutExplicit.oneTimeTotal);
  assert.equal(estimateWithInherent.oneTimeTotal, 3_000_000); // 1.5M base + 1.5M tier
  assert.deepEqual(estimateWithInherent.deduplicatedAddonLabels.sort(), [
    "Integrasi Google Maps Interaktif",
    "Integrasi Umpan Media Sosial",
    "Panel Admin (CMS)",
  ]);
});
