import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-pl-cream/40 p-6">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl shadow-pl-green/10">
        {/* Nivel SaaS: marca PineappleLoyalty — la marca del comercio
            aparece solo dentro de su organización y tarjetas. */}
        <Image
          src="/pineapple/logo.png"
          alt="PineappleLoyalty — Make every visit count."
          width={2172}
          height={724}
          priority
          className="mx-auto mb-6 w-96 max-w-full sm:w-[22rem]"
        />
        {children}
        <p className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm font-semibold text-ink-soft transition-colors hover:text-pl-green"
          >
            ← Volver al inicio
          </Link>
        </p>
      </div>
    </main>
  );
}
