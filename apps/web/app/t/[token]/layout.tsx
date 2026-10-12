import { TabBar } from "./_components/tab-bar";

export const instant = false;

// Marco de la app del cliente: columna móvil centrada + barra de tabs mínima
// (Mi tarjeta / Mi QR). El resto de rutas se alcanza por enlaces internos.
export default async function CardAppLayout({
  children,
  params,
}: LayoutProps<"/t/[token]">) {
  const { token } = await params;
  const base = `/t/${token}`;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white">
      <main className="flex-1 pb-20">{children}</main>
      <TabBar base={base} />
    </div>
  );
}
