import Link from "next/link";

export const instant = false;

// Navegación por organización. La autorización real va en cada página
// (server-side); este layout es solo estructura.
const NAV = [
  ["", "Inicio"],
  ["customers", "Clientes"],
  ["scan", "Escanear"],
  ["programs", "Programas"],
  ["rewards", "Recompensas"],
  ["team", "Equipo"],
  ["locations", "Sedes"],
  ["audit", "Auditoría"],
  ["settings", "Config"],
] as const;

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  return (
    <>
      <nav className="mb-6 flex flex-wrap gap-1 border-b border-neutral-200 pb-3 text-sm dark:border-neutral-800">
        {NAV.map(([path, label]) => (
          <Link
            key={path}
            href={`/dashboard/${org}${path ? `/${path}` : ""}`}
            className="rounded-md px-3 py-1.5 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
          >
            {label}
          </Link>
        ))}
      </nav>
      {children}
    </>
  );
}
