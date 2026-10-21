import { DEFAULT_BRAND_COLOR, brandVars } from "@/lib/brand";
import { TabBar } from "./_components/tab-bar";
import { getCardAppData } from "./_components/data";

export const instant = false;

// Marco de la app del cliente: columna móvil centrada + barra de tabs mínima
// (Mi tarjeta / Mi QR). El resto de rutas se alcanza por enlaces internos.
export default async function CardAppLayout({
  children,
  params,
}: LayoutProps<"/t/[token]">) {
  const { token } = await params;
  const base = `/t/${token}`;
  // Color de tarjeta del comercio (Configuración); misma llamada que la página.
  const card = await getCardAppData(token);

  return (
    <div
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white"
      style={brandVars(card?.brand_color ?? DEFAULT_BRAND_COLOR)}
    >
      <main className="flex-1 pb-24">{children}</main>
      <TabBar base={base} />
    </div>
  );
}
