import { PageShell } from "../_landing/shell";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageShell>{children}</PageShell>;
}
