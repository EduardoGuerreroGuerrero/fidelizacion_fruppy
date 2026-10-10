export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-pastel-mint/40 p-6">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl shadow-brand/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/logo-circle.jpg"
          alt="Fruppy"
          className="mx-auto mb-4 size-16 rounded-full shadow-md"
        />
        <h1 className="mb-6 text-center text-2xl font-bold text-ink">Fruppy</h1>
        {children}
      </div>
    </main>
  );
}
