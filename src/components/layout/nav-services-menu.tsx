"use client";

import Link from "next/link";
import { Icon, IconBadge } from "@/components/ui/icon";

interface NavServicesMenuProps {
  open: boolean;
  onClose: () => void;
  activePath?: string;
}

const serviceEcosystems = [
  {
    id: "technology",
    name: "Technology",
    href: "/technology",
    badgeName: "code" as const,
    tone: "technology" as const,
    description: "Website, domain & maintenance",
  },
  {
    id: "creative",
    name: "Creative",
    href: "/creative",
    badgeName: "palette" as const,
    tone: "creative" as const,
    description: "Branding, konten & media sosial",
  },
  {
    id: "business",
    name: "Business",
    href: "/business",
    badgeName: "app" as const,
    tone: "business" as const,
    description: "Software & SaaS bisnis",
  },
];

export function NavServicesMenu({ open, onClose, activePath }: NavServicesMenuProps) {
  return (
    <div
      id="services-dropdown"
      role="region"
      aria-label="Menu Layanan TELLU"
      className={`nav-dropdown-panel absolute left-1/2 -translate-x-1/2 top-full pt-3 z-50 w-[310px] max-w-[calc(100vw-2rem)] transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        open
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-[5px] pointer-events-none invisible"
      }`}
    >
      <div className="overflow-hidden rounded-2xl border border-line bg-white/98 p-2 shadow-xl shadow-black/8 backdrop-blur-xl">
        <div className="flex flex-col gap-1">
          {serviceEcosystems.map((eco) => {
            const isActive = activePath === eco.href;
            return (
              <Link
                key={eco.id}
                href={eco.href}
                onClick={onClose}
                className={`group flex items-center justify-between gap-3 rounded-xl p-2.5 transition-all ${
                  isActive
                    ? "bg-black/[0.04]"
                    : "hover:bg-black/[0.03]"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <IconBadge name={eco.badgeName} tone={eco.tone} />
                  <div className="min-w-0">
                    <span className="block text-sm font-bold text-foreground">
                      {eco.name}
                    </span>
                    <p className="text-xs text-muted truncate mt-0.5">
                      {eco.description}
                    </p>
                  </div>
                </div>
                <span
                  aria-hidden="true"
                  className="text-muted/40 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground"
                >
                  <Icon name="chevron-right" size={15} />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
