"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import {
  websiteBaruPackages,
  revampPackages,
  packageComparisonRows,
  PRICING_DISCLAIMER,
} from "@/lib/technology-pricing";

const PACKAGE_TO_ESTIMATOR: Record<string, { category: "baru" | "revamp"; tierId: string }> = {
  starter: { category: "baru", tierId: "baru-1" },
  business: { category: "baru", tierId: "baru-5-7" },
  enterprise: { category: "baru", tierId: "baru-custom" },
  "revamp-lite": { category: "revamp", tierId: "revamp-refresh" },
  "revamp-pro": { category: "revamp", tierId: "revamp-rebuild" },
  "revamp-enterprise": { category: "revamp", tierId: "revamp-transform" },
};

export function TechnologyPricingSection({
  title = "Pilih paket website untuk bisnismu.",
  description = "Pilihan paket sebagai acuan awal sebelum konsultasi, mulai dari landing page satu halaman hingga website dengan fungsi khusus.",
}: {
  title?: string;
  description?: string;
}) {
  const [activeCategory, setActiveCategory] = useState<"baru" | "revamp">("baru");
  const [showComparison, setShowComparison] = useState(false);

  function selectPackageInEstimator(packageId: string) {
    const preset = PACKAGE_TO_ESTIMATOR[packageId];
    if (!preset) return;
    window.dispatchEvent(new CustomEvent("tellu:select-estimator", { detail: preset }));
  }

  return (
    <section id="packages" className="tech-pricing-section page-container section-space" aria-labelledby="tech-pricing-heading">
      <span id="pricing" className="scroll-mt-28" aria-hidden="true" />

      <div data-reveal className="tech-section-heading">
        <h2 id="tech-pricing-heading" className="display">
          {title}
        </h2>
        <p>{description}</p>

        {/* Segmented Control Toggle */}
        <div className="tech-pricing-toggle-wrap">
          <div className="tech-pricing-toggle" role="tablist" aria-label="Pilihan kategori paket">
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === "baru"}
              className={`tech-toggle-btn ${activeCategory === "baru" ? "active" : ""}`}
              onClick={() => setActiveCategory("baru")}
            >
              <span>Website Baru</span>
              <span className="tech-toggle-sub">Mulai Rp1,5 Juta</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === "revamp"}
              className={`tech-toggle-btn ${activeCategory === "revamp" ? "active" : ""}`}
              onClick={() => setActiveCategory("revamp")}
            >
              <span>Revamp Website</span>
              <span className="tech-toggle-sub">Mulai Rp2,5 Juta</span>
            </button>
          </div>
        </div>
      </div>

      {/* Website Baru Package Cards */}
      {activeCategory === "baru" && (
        <div className="tech-pricing-grid" data-stagger>
          {websiteBaruPackages.map((pkg) => (
            <article
              key={pkg.id}
              className={`tech-pricing-card ${pkg.popular ? "featured" : ""}`}
            >
              {pkg.popular && (
                <div className="tech-card-popular-badge">
                  <span>Untuk Bisnis Berkembang</span>
                </div>
              )}

              <div className="tech-pricing-card-top">
                <span className="tech-card-tier-label">{pkg.targetAudience}</span>
                <h3 className="tech-card-name">{pkg.name}</h3>
                <p className="tech-card-tagline">{pkg.tagline}</p>

                <div className="tech-card-price-block">
                  <div className="tech-card-price">{pkg.priceLabel}*</div>
                  <span className="tech-card-note">{pkg.note}</span>
                </div>
              </div>

              <div className="tech-card-meta">
                <div className="tech-card-meta-item">
                  <span className="meta-label">Batas Revisi:</span>
                  <span className="meta-value">{pkg.revisions}</span>
                </div>
                <div className="tech-card-meta-item">
                  <span className="meta-label">Estimasi Waktu:</span>
                  <span className="meta-value">{pkg.deliveryTimeEstimate}</span>
                </div>
              </div>

              <div className="tech-card-features">
                <p className="features-title">Fitur yang didapatkan:</p>
                <ul className="features-list">
                  {pkg.features.map((feat) => (
                    <li key={feat.text} className={feat.included ? "included" : "excluded"}>
                      <span className="feat-icon" aria-hidden="true">
                        {feat.included ? <Icon name="check" size={14} /> : "–"}
                      </span>
                      <span className={feat.highlight ? "font-semibold text-foreground" : ""}>
                        {feat.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="tech-card-action">
                <a
                  href="#estimator"
                  onClick={() => selectPackageInEstimator(pkg.id)}
                  className={`${pkg.popular ? "button-primary" : "button-outline"} w-full justify-center inline-flex items-center gap-2 text-center text-sm`}
                >
                  <span>Hitung Estimasi Paket Ini</span>
                  <Icon name="calculator" size={16} />
                </a>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Revamp Website Package Cards */}
      {activeCategory === "revamp" && (
        <div className="tech-pricing-grid" data-stagger>
          {revampPackages.map((pkg) => (
            <article
              key={pkg.id}
              className={`tech-pricing-card ${pkg.popular ? "featured" : ""}`}
            >
              <div className="tech-pricing-card-top">
                <span className="tech-card-tier-label">Revamp Website Lama</span>
                <h3 className="tech-card-name">{pkg.name}</h3>
                <p className="tech-card-tagline">{pkg.tagline}</p>

                <div className="tech-card-price-block">
                  <div className="tech-card-price">{pkg.priceLabel}*</div>
                  <span className="tech-card-note">Disesuaikan hasil audit website</span>
                </div>
              </div>

              <div className="tech-card-features">
                <p className="features-title">Ruang lingkup pembaruan:</p>
                <ul className="features-list">
                  {pkg.features.map((feat) => (
                    <li key={feat.text} className="included">
                      <span className="feat-icon" aria-hidden="true">
                        <Icon name="check" size={14} />
                      </span>
                      <span>{feat.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="tech-card-action">
                <a
                  href="#estimator"
                  onClick={() => selectPackageInEstimator(pkg.id)}
                  className={`${pkg.popular ? "button-primary" : "button-outline"} w-full justify-center inline-flex items-center gap-2 text-center text-sm`}
                >
                  <span>Simulasi Biaya Revamp</span>
                  <Icon name="calculator" size={16} />
                </a>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Feature Comparison Accordion / Toggle */}
      {activeCategory === "baru" && (
        <div className="tech-comparison-container" data-reveal>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
            <div>
              <h3 className="text-xl font-semibold">Tabel Perbandingan Fitur Paket</h3>
              <p className="text-muted text-sm mt-1">
                Lihat rincian spesifikasi teknis dan perbedaan antar paket Website Baru.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowComparison((prev) => !prev)}
              className="button-outline text-sm inline-flex items-center gap-2"
              aria-expanded={showComparison}
            >
              <span>{showComparison ? "Sembunyikan Perbandingan" : "Buka Perbandingan Lengkap"}</span>
              <Icon
                name="chevron-down"
                size={16}
                className={`transition-transform duration-200 ${showComparison ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {showComparison && (
            <div className="tech-comparison-table-wrapper" tabIndex={0} aria-label="Tabel perbandingan fitur paket website">
              <table className="tech-comparison-table">
                <thead>
                  <tr>
                    <th scope="col" className="text-left w-1/3">Spesifikasi & Fitur</th>
                    <th scope="col" className="text-center w-1/5">Starter</th>
                    <th scope="col" className="text-center w-1/5 bg-warm-surface font-semibold">Business</th>
                    <th scope="col" className="text-center w-1/4">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {packageComparisonRows.map((row, idx) => (
                    <tr key={`${row.name}-${idx}`}>
                      <td className="font-medium text-foreground">
                        <span className="text-xs text-muted block">{row.category}</span>
                        {row.name}
                      </td>
                      <td className="text-center">
                        {typeof row.starter === "boolean" ? (
                          row.starter ? (
                            <span className="inline-flex justify-center text-[#a44a00]" aria-label="Termasuk">
                              <Icon name="check" size={15} />
                            </span>
                          ) : (
                            <span className="text-muted" aria-label="Tidak termasuk">–</span>
                          )
                        ) : (
                          <span className="text-xs">{row.starter}</span>
                        )}
                      </td>
                      <td className="text-center bg-warm-surface font-medium">
                        {typeof row.business === "boolean" ? (
                          row.business ? (
                            <span className="inline-flex justify-center text-[#a44a00]" aria-label="Termasuk">
                              <Icon name="check" size={15} />
                            </span>
                          ) : (
                            <span className="text-muted" aria-label="Tidak termasuk">–</span>
                          )
                        ) : (
                          <span className="text-xs font-semibold">{row.business}</span>
                        )}
                      </td>
                      <td className="text-center">
                        {typeof row.enterprise === "boolean" ? (
                          row.enterprise ? (
                            <span className="inline-flex justify-center text-[#a44a00]" aria-label="Termasuk">
                              <Icon name="check" size={15} />
                            </span>
                          ) : (
                            <span className="text-muted" aria-label="Tidak termasuk">–</span>
                          )
                        ) : (
                          <span className="text-xs">{row.enterprise}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Draft Disclaimer Notice */}
      <div className="tech-pricing-disclaimer-box" role="note">
        <p className="text-xs text-muted leading-relaxed">
          <strong>Catatan:</strong> {PRICING_DISCLAIMER} Syarat dan ketentuan definitif dituangkan dalam proposal kerja sama resmi TELLU.
        </p>
      </div>
    </section>
  );
}
