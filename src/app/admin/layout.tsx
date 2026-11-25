import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "TELLU Admin",
    template: "%s | TELLU Admin",
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f9f7f3] text-[#20211f] antialiased">
      {children}
    </div>
  );
}
