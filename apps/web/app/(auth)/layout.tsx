export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-pastel-mint/40 p-6">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl shadow-brand/10">
        {/* Nivel SaaS: sin logo de ningún comercio — la marca del comercio
            aparece solo dentro de su organización y tarjetas. */}
        <h1 className="mb-6 text-center text-2xl font-bold text-ink">
          Fidelización
        </h1>
        {children}
      </div>
    </main>
  );
}
