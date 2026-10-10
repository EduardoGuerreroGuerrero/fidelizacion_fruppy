// Promociones de temporada de Fruppy Helados — contenido estático mientras no
// exista una tabla/campañas en el backend.
export type Promo = {
  badge: string;
  badgeColor: string;
  category: "helados" | "granizados" | "combos" | "descuentos";
  title: string;
  description: string;
  price: string;
  oldPrice?: string;
  image: string;
  bg: string;
};

export const PROMO_CATEGORIES = [
  { key: "todas", label: "Todas" },
  { key: "helados", label: "Helados" },
  { key: "granizados", label: "Granizados" },
  { key: "combos", label: "Combos" },
  { key: "descuentos", label: "Descuentos" },
] as const;

export const PROMOS: Promo[] = [
  {
    badge: "PROMO DESTACADA",
    badgeColor: "bg-accent",
    category: "helados",
    title: "Parfait especial",
    description: "Con frutas de temporada y topping a elección",
    price: "$12.000",
    oldPrice: "$16.000",
    image: "/brand/promo-1.jpg",
    bg: "bg-pastel-pink",
  },
  {
    badge: "2X1",
    badgeColor: "bg-[#f0a040]",
    category: "granizados",
    title: "Granizados 2x1",
    description: "Todos los martes en sabores seleccionados",
    price: "2x1",
    image: "/brand/promo-2.jpg",
    bg: "bg-pastel-cream",
  },
  {
    badge: "GRATIS",
    badgeColor: "bg-brand",
    category: "helados",
    title: "Helado gratis",
    description: "Con la compra de un parfait grande",
    price: "$0",
    image: "/brand/promo-3.jpg",
    bg: "bg-pastel-mint",
  },
  {
    badge: "TOPPING",
    badgeColor: "bg-[#9b6ddf]",
    category: "descuentos",
    title: "Topping extra gratis",
    description: "En la compra de cualquier helado mediano",
    price: "Gratis",
    image: "/brand/promo-4.jpg",
    bg: "bg-pastel-lav",
  },
  {
    badge: "ESPECIAL",
    badgeColor: "bg-[#4a9fd8]",
    category: "combos",
    title: "Parfait mediano",
    description: "Solo por tiempo limitado",
    price: "$8.900",
    image: "/brand/promo-5.jpg",
    bg: "bg-pastel-sky",
  },
];
