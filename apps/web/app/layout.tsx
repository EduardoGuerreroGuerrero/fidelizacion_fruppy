import type { Metadata, Viewport } from "next";
import { Caveat, Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  // 800: los titulares de la landing usan font-extrabold; sin este peso el
  // navegador sintetiza la negrita.
  weight: ["400", "500", "600", "700", "800"],
});

// Tipografía manuscrita para acentos decorativos del landing.
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Esquema claro fijo: sin inversión automática de colores en el teléfono.
export const viewport: Viewport = { colorScheme: "light" };

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.pineappleloyalty.com",
  ),
  title: "PineappleLoyalty — Make every visit count.",
  description: "SaaS de fidelización, CRM y tarjetas Wallet para comercios locales",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${poppins.variable} ${geistMono.variable} ${caveat.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
