import { stampIconFor, type StampIconKey } from "./stamp-icons";

// Fila de sellos: círculos rosas con la figura del comercio rellena; el
// resto en contorno gris. La figura es configurable por comercio (item 9d).
export function StampRow({
  current,
  goal,
  icon,
}: {
  current: number;
  goal: number;
  icon?: StampIconKey | string | null;
}) {
  const total = Math.max(goal, current);
  const Icon = stampIconFor(icon);
  return (
    <div className="flex justify-between px-5">
      {Array.from({ length: total }, (_, i) => {
        const on = i < current;
        return (
          <span
            key={i}
            className={`flex size-9 items-center justify-center rounded-full ${
              on ? "bg-pastel-pink" : "border border-[#f0d4dc] bg-white"
            }`}
          >
            <Icon filled={on} className="size-6" />
          </span>
        );
      })}
    </div>
  );
}

// Versión mini para las tarjetas de bonos.
export function StampMini({
  current,
  goal,
  icon,
  className = "",
}: {
  current: number;
  goal: number;
  icon?: StampIconKey | string | null;
  className?: string;
}) {
  const total = Math.max(goal, 1);
  const Icon = stampIconFor(icon);
  return (
    <span className={`flex items-center gap-1 ${className}`}>
      {Array.from({ length: Math.min(total, 10) }, (_, i) => (
        <Icon key={i} filled={i < current} className="size-4" />
      ))}
      <span className="ml-1 whitespace-nowrap text-xs font-semibold tabular-nums text-ink">
        {Math.min(current, total)} / {total}
      </span>
    </span>
  );
}
