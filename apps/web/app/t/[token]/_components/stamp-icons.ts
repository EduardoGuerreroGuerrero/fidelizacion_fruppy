import {
  StampBandage,
  StampCoffee,
  StampFlower,
  StampHeart,
  StampMustache,
  StampPaw,
  StampStar,
  StampStrawberry,
} from "./icons";

export type StampIconKey =
  | "strawberry"
  | "mustache"
  | "bandage"
  | "paw"
  | "coffee"
  | "heart"
  | "star"
  | "flower";

export const STAMP_ICON_OPTIONS: {
  key: StampIconKey;
  label: string;
  hint: string;
  Icon: (p: { filled: boolean; className?: string }) => React.JSX.Element;
}[] = [
  { key: "strawberry", label: "Fresa", hint: "Heladerías, postres", Icon: StampStrawberry },
  { key: "coffee", label: "Taza de café", hint: "Cafeterías", Icon: StampCoffee },
  { key: "mustache", label: "Bigote", hint: "Barberías, peluquerías", Icon: StampMustache },
  { key: "bandage", label: "Bandita", hint: "Salud, clínicas, farmacias", Icon: StampBandage },
  { key: "paw", label: "Huella", hint: "Veterinarias, pet shops", Icon: StampPaw },
  { key: "flower", label: "Flor", hint: "Floristerías, spa", Icon: StampFlower },
  { key: "heart", label: "Corazón", hint: "General / afecto a la marca", Icon: StampHeart },
  { key: "star", label: "Estrella", hint: "General / premium", Icon: StampStar },
];

export const STAMP_ICON_KEYS = STAMP_ICON_OPTIONS.map((o) => o.key);

const BY_KEY = new Map(STAMP_ICON_OPTIONS.map((o) => [o.key, o.Icon]));

export function stampIconFor(key: string | null | undefined) {
  return BY_KEY.get((key ?? "strawberry") as StampIconKey) ?? StampStrawberry;
}
