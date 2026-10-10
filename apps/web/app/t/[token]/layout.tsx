import { TabBar } from "./_components/tab-bar";

export const instant = false;

// Marco de la app del cliente: columna móvil centrada + barra de tabs inferior.
export default async function CardAppLayout({
  children,
  params,
}: LayoutProps<"/t/[token]">) {
  const { token } = await params;
  const base = `/t/${token}`;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white shadow-[0_0_40px_rgba(0,0,0,0.06)]">
      <main className="flex-1 pb-24">{children}</main>
      <TabBar base={base} />
    </div>
  );
}
