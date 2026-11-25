import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdminSession, checkServerAdminNetworkAccess } from "@/lib/cms/next-server";
import { LoginForm } from "@/components/admin/login-form";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const net = await checkServerAdminNetworkAccess();
  if (net.allowed) {
    const existingUser = await getCurrentAdminSession();
    if (existingUser) {
      redirect("/admin");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#f9f7f3]">
      <div className="w-full max-w-md rounded-2xl border border-[#e6e4dc] bg-white p-7 sm:p-9 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Image
            src="/brand/tellu-logo.png"
            alt="TELLU Logo"
            width={629}
            height={589}
            sizes="36px"
            className="h-9 w-9 object-contain"
            priority
          />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[#20211f]">TELLU Control Center</h1>
            <p className="text-xs text-[#666961]">Manajemen Konten & Blog Internal</p>
          </div>
        </div>

        {!net.allowed ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-950">
            <p className="font-bold mb-1">Akses Admin Dinonaktifkan</p>
            <p>{net.reason}</p>
            <p className="mt-2 text-amber-900">
              Untuk lingkungan produksi, aktifkan HTTPS reverse proxy terlebih dahulu serta atur{" "}
              <code>TELLU_ADMIN_ENABLED=true</code> dan <code>TELLU_ADMIN_ORIGIN=https://...</code>.
            </p>
          </div>
        ) : (
          <LoginForm />
        )}

        <div className="mt-6 pt-5 border-t border-[#e6e4dc] flex items-center justify-between text-xs text-[#666961]">
          <span>Akses terbatas tim TELLU</span>
          <Link href="/" className="font-semibold text-[#20211f] hover:underline">
            Kembali ke beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
