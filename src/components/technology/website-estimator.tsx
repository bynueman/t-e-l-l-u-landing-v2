"use client";

import { useState, useMemo, useEffect, useRef, useSyncExternalStore } from "react";
import { contactConfig } from "@/config/site";
import {
  estimatorConfig,
  calculateProjectEstimate,
  buildConsultationInquiryMessage,
  formatRupiah,
} from "@/lib/technology-pricing";
import { Icon, type IconName } from "@/components/ui/icon";

interface WebsiteEstimatorProps {
  title?: string;
  description?: string;
}

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

// Map addon IDs to meaningful semantic SVG icons
const addonIconMap: Record<string, IconName> = {
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

function SmoothCounter({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const start = prevValueRef.current;
    const end = value;
    if (start === end) return;

    const startTime = performance.now();
    const duration = 350; // ms

    let animId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * ease);
      setDisplayValue(current);

      if (progress < 1) {
        animId = requestAnimationFrame(tick);
      } else {
        prevValueRef.current = end;
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [value]);

  return <span className="tabular-nums font-bold">{formatRupiah(displayValue)}</span>;
}

function AnimatedPrice({
  value,
  prefersReducedMotion,
}: {
  value: number;
  prefersReducedMotion: boolean;
}) {
  if (prefersReducedMotion) {
    return <span className="tabular-nums font-bold">{formatRupiah(value)}</span>;
  }
  return <SmoothCounter value={value} />;
}

export function WebsiteEstimator({
  title = "Hitung estimasi biaya websitemu.",
  description = "Simulasikan perkiraan biaya pembuatan atau revamp website berdasarkan jumlah halaman dan fitur yang kamu perlukan.",
}: WebsiteEstimatorProps) {
  const [category, setCategory] = useState<"baru" | "revamp">("baru");
  const [tierId, setTierId] = useState<string>("baru-1");
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  useEffect(() => {
    function handlePreset(event: Event) {
      const detail = (event as CustomEvent<{ category?: "baru" | "revamp"; tierId?: string }>).detail;
      if (!detail?.category) return;
      setCategory(detail.category);
      if (detail.tierId) setTierId(detail.tierId);
      setSelectedAddonIds([]);
    }
    window.addEventListener("tellu:select-estimator", handlePreset);
    return () => window.removeEventListener("tellu:select-estimator", handlePreset);
  }, []);

  function handleCategoryChange(nextCategory: "baru" | "revamp") {
    setCategory(nextCategory);
    setTierId(estimatorConfig.pageTiers[nextCategory][0].id);
    setSelectedAddonIds([]);
  }

  function toggleAddon(addonId: string) {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  }

  function handleReset() {
    setTierId(estimatorConfig.pageTiers[category][0].id);
    setSelectedAddonIds([]);
  }

  const estimate = useMemo(() => {
    return calculateProjectEstimate({
      category,
      tierId,
      selectedAddonIds,
    });
  }, [category, tierId, selectedAddonIds]);

  const activeTiers = estimatorConfig.pageTiers[category];
  const activeTier = activeTiers.find((t) => t.id === tierId) ?? activeTiers[0];
  const inherentAddonIds = new Set(activeTier.inherentAddonIds ?? []);

  const visibleAddons = estimatorConfig.addons.filter(
    (addon) => !addon.onlyFor || addon.onlyFor === category
  );

  function handleConsultation() {
    const message = buildConsultationInquiryMessage(estimate);
    const url = contactConfig.whatsapp.getDirectUrl(message);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function handleCopyEstimate() {
    const message = buildConsultationInquiryMessage(estimate);
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      // Clipboard API may be unavailable in restricted contexts
    }
  }

  return (
    <section
      id="estimator"
      className="tech-estimator-section page-container section-space"
      aria-labelledby="tech-estimator-heading"
    >
      {/* Section Heading */}
      <div data-reveal className="tech-section-heading">
        <h2 id="tech-estimator-heading" className="display">
          {title}
        </h2>
        <p>{description}</p>
      </div>

      <div className="tech-estimator-layout">
        {/* Left Column: Interactive Configuration Steps */}
        <div className="tech-estimator-form" data-reveal>
          {/* Step 1: Project Type Selection */}
          <div className="estimator-step-card">
            <div className="step-card-header">
              <span className="step-number" aria-hidden="true">1</span>
              <div>
                <h3>Pilih Jenis Proyek</h3>
                <p className="text-xs text-muted mt-0.5">Tentukan apakah kamu ingin membuat website baru dari awal atau memperbarui website lama.</p>
              </div>
            </div>

            <div className="estimator-type-grid" role="radiogroup" aria-label="Jenis proyek website">
              {/* Option A: Website Baru */}
              <button
                type="button"
                role="radio"
                aria-checked={category === "baru"}
                className={`estimator-type-card ${category === "baru" ? "active" : ""}`}
                onClick={() => handleCategoryChange("baru")}
              >
                <div className="estimator-type-card-top">
                  <div className="estimator-type-icon-box">
                    <Icon name="browser" size={22} />
                  </div>
                  <div className={`estimator-radio-indicator ${category === "baru" ? "active" : ""}`}>
                    {category === "baru" && <Icon name="check" size={13} />}
                  </div>
                </div>
                <div className="mt-3">
                  <span className="font-bold text-base block text-foreground">Pembuatan Website Baru</span>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    Mulai dari nol dengan desain custom, arsitektur mobile-first, domain, hosting, dan SSL tahun pertama.
                  </p>
                  <span className="inline-block mt-3 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fff4ec] text-[#a44a00] border border-[#fed7aa]">
                    Mulai Rp1.500.000
                  </span>
                </div>
              </button>

              {/* Option B: Revamp Website */}
              <button
                type="button"
                role="radio"
                aria-checked={category === "revamp"}
                className={`estimator-type-card ${category === "revamp" ? "active" : ""}`}
                onClick={() => handleCategoryChange("revamp")}
              >
                <div className="estimator-type-card-top">
                  <div className="estimator-type-icon-box">
                    <Icon name="refresh" size={22} />
                  </div>
                  <div className={`estimator-radio-indicator ${category === "revamp" ? "active" : ""}`}>
                    {category === "revamp" && <Icon name="check" size={13} />}
                  </div>
                </div>
                <div className="mt-3">
                  <span className="font-bold text-base block text-foreground">Revamp Website Lama</span>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    Perbarui tampilan dan kode website lama agar lebih ringan tanpa menghilangkan konten maupun tautan penting.
                  </p>
                  <span className="inline-block mt-3 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fff4ec] text-[#a44a00] border border-[#fed7aa]">
                    Mulai Rp2.500.000
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Step 2: Page Scope / Tier Selection */}
          <div className="estimator-step-card">
            <div className="step-card-header">
              <span className="step-number" aria-hidden="true">2</span>
              <div>
                <h3>{estimatorConfig.tierQuestions[category]}</h3>
                <p className="text-xs text-muted mt-0.5">Pilih skala dan kompleksitas halaman yang paling sesuai dengan kebutuhan bisnismu.</p>
              </div>
            </div>

            <div className="estimator-tier-list" role="radiogroup" aria-label={estimatorConfig.tierQuestions[category]}>
              {activeTiers.map((tier) => {
                const isSelected = tierId === tier.id;
                const hasInherent = tier.inherentAddonIds && tier.inherentAddonIds.length > 0;

                return (
                  <button
                    key={tier.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setTierId(tier.id)}
                    className={`estimator-tier-item ${isSelected ? "active" : ""}`}
                  >
                    <div className="flex items-start gap-3.5 flex-1 text-left min-w-0">
                      <div className={`estimator-radio-indicator mt-0.5 ${isSelected ? "active" : ""}`}>
                        {isSelected && <Icon name="check" size={13} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-foreground">{tier.label}</span>
                          {hasInherent && (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#e0f2fe] text-[#0369a1]">
                              Termasuk CMS
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted mt-0.5 leading-relaxed">{tier.description}</p>
                      </div>
                    </div>
                    <div className="estimator-tier-price">
                      {tier.price > 0 ? (
                        <span className="font-bold text-[#a44a00]">+{formatRupiah(tier.price)}</span>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          Termasuk di Dasar
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Optional Features & Add-ons */}
          <div className="estimator-step-card">
            <div className="step-card-header">
              <span className="step-number" aria-hidden="true">3</span>
              <div>
                <h3>Fitur &amp; Modul Tambahan</h3>
                <p className="text-xs text-muted mt-0.5">Pilih fitur tambahan di luar paket dasar jika websitemu membutuhkannya.</p>
              </div>
            </div>

            <div className="estimator-features-grid" role="group" aria-label="Pilihan fitur tambahan">
              {visibleAddons.map((addon) => {
                const isInherentlyIncluded = inherentAddonIds.has(addon.id);
                const isSelected = selectedAddonIds.includes(addon.id) || isInherentlyIncluded;
                const iconName = addonIconMap[addon.id] || "sparkles";

                return (
                  <button
                    key={addon.id}
                    type="button"
                    role="checkbox"
                    aria-checked={isSelected}
                    aria-disabled={isInherentlyIncluded}
                    disabled={isInherentlyIncluded}
                    onClick={() => toggleAddon(addon.id)}
                    className={`estimator-feature-card ${isSelected ? "active" : ""} ${
                      isInherentlyIncluded ? "inherent-locked" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="estimator-feature-icon">
                        <Icon name={iconName} size={18} />
                      </div>
                      <div className={`estimator-checkbox-box ${isSelected ? "checked" : ""} ${isInherentlyIncluded ? "locked" : ""}`}>
                        {isSelected && <Icon name="check" size={12} />}
                      </div>
                    </div>

                    <div className="mt-2.5 text-left">
                      <span className="font-bold text-xs text-foreground block leading-snug">
                        {addon.label}
                      </span>
                      {addon.description && (
                        <p className="text-[11px] text-muted mt-1 leading-relaxed line-clamp-2">
                          {addon.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-line/60 flex items-center justify-between text-left">
                      {isInherentlyIncluded ? (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Sudah Termasuk
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-[#a44a00]">
                          {addon.isRecurringMonthly
                            ? `+${formatRupiah(addon.price)}/bln`
                            : `+${formatRupiah(addon.price)}`}
                        </span>
                      )}
                      {addon.isRecurringMonthly && (
                        <span className="text-xs text-muted">Berkala</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Reset Action */}
            <div className="mt-5 pt-4 border-t border-line/60 flex items-center justify-between">
              <span className="text-xs text-muted">Ingin mengulang simulasi dari awal?</span>
              <button
                type="button"
                onClick={handleReset}
                className="estimator-reset-btn inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-foreground transition-colors"
              >
                <Icon name="reset" size={14} />
                <span>Atur Ulang Pilihan</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Live Estimation Summary Panel */}
        <aside className="tech-estimator-summary" aria-labelledby="estimator-summary-heading">
          <div className="estimator-summary-panel">
            {/* Summary Top Bar */}
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Icon name="calculator" size={15} className="text-[#ffaa66]" />
                <h3 id="estimator-summary-heading" className="text-xs uppercase tracking-wider text-white/80 font-bold">
                  Estimasi Biaya Proyekmu
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#a44a00]/40 text-[#ffbe88] border border-[#a44a00]/60">
                {category === "baru" ? "Website Baru" : "Revamp Website"}
              </span>
            </div>

            {/* Total Price Block with Counter Animation */}
            <div className="my-5">
              <span className="text-xs text-white/60 block font-medium">Perkiraan Biaya Awal (Sekali Bayar):</span>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#ff8a3d] tracking-tight mt-1 flex items-baseline gap-1">
                <AnimatedPrice
                  value={estimate.oneTimeTotal}
                  prefersReducedMotion={prefersReducedMotion}
                />
                <span className="text-xs text-white/50 font-normal">*</span>
              </div>

              {/* Recurring Monthly Cost Separation */}
              {estimate.monthlyTotal > 0 && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                  <span className="text-white/70 flex items-center gap-1.5">
                    <Icon name="wrench" size={13} className="text-[#ffaa66]" />
                    <span>Biaya Perawatan Berkala:</span>
                  </span>
                  <strong className="text-white font-bold tabular-nums">
                    {estimate.formattedMonthlyTotal} / bulan
                  </strong>
                </div>
              )}
            </div>

            {/* Itemized Cost Breakdown */}
            <div className="estimator-breakdown-list border-t border-white/10 pt-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 block mb-2.5">
                Rincian Biaya:
              </span>

              {/* Base Price Row */}
              <div className="estimator-breakdown-row">
                <span className="text-white/70">Biaya Paket Dasar</span>
                <span className="text-white font-semibold tabular-nums">{formatRupiah(estimate.basePrice)}</span>
              </div>

              {/* Scope Tier Row */}
              <div className="estimator-breakdown-row">
                <span className="text-white/70 truncate mr-2">{estimate.tierLabel}</span>
                <span className="text-white font-semibold tabular-nums whitespace-nowrap">
                  {estimate.tierPrice > 0 ? `+${formatRupiah(estimate.tierPrice)}` : "Termasuk"}
                </span>
              </div>

              {/* Selected Add-ons List */}
              {estimate.selectedAddons.map((addon) => (
                <div key={addon.id} className="estimator-breakdown-row">
                  <span className="text-white/70 truncate mr-2">{addon.label}</span>
                  <span className="text-white font-semibold tabular-nums whitespace-nowrap">
                    {addon.price === 0
                      ? "Termasuk"
                      : addon.isRecurringMonthly
                      ? `+${formatRupiah(addon.price)}/bln`
                      : `+${formatRupiah(addon.price)}`}
                  </span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 pt-5 border-t border-white/10 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleConsultation}
                className="button-primary w-full justify-center !min-h-12 text-sm font-bold inline-flex items-center gap-2 !bg-[#c24d00] hover:!bg-[#a84200] text-white shadow-lg shadow-black/30"
              >
                <Icon name="whatsapp" size={17} />
                <span>Konsultasikan via WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={handleCopyEstimate}
                className="inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/[0.06] px-4 text-xs font-semibold text-white transition-colors hover:bg-white/[0.12]"
              >
                <Icon name={copied ? "check" : "copy"} size={15} />
                <span>{copied ? "Ringkasan Estimasi Tersalin" : "Salin Ringkasan Estimasi"}</span>
              </button>
            </div>

            {/* Disclaimer */}
            <p className="estimator-panel-disclaimer text-xs text-white/70 leading-relaxed mt-4">
              *{estimate.disclaimer}
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
