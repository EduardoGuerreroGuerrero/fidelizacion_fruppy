import Image from "next/image";
import Link from "next/link";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-white">
      <header className="border-b border-neutral-100">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/pineapple/isotipo-trans.png"
              alt="PineappleLoyalty"
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
            />
            <span className="text-base font-extrabold tracking-tight">
              <span className="text-pl-green">Pineapple</span>
              <span className="text-pl-green-2">Loyalty</span>
            </span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">{children}</main>
      <footer className="border-t border-neutral-100 py-6 text-center text-xs text-ink-soft">
        <Link href="/" className="hover:text-pl-green">
          ← Volver al inicio
        </Link>
      </footer>
    </div>
  );
}
