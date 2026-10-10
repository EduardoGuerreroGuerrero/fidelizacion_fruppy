import { StampStrawberry } from "./icons";

// Fila de sellos: círculos rosas con fresa rellena; el resto en contorno gris.
export function StampRow({ current, goal }: { current: number; goal: number }) {
  const total = Math.max(goal, current);
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
            <StampStrawberry filled={on} className="size-6" />
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
  className = "",
}: {
  current: number;
  goal: number;
  className?: string;
}) {
  const total = Math.max(goal, 1);
  return (
    <span className={`flex items-center gap-1 ${className}`}>
      {Array.from({ length: Math.min(total, 12) }, (_, i) => (
        <StampStrawberry
          key={i}
          filled={i < current}
          className="size-4"
        />
      ))}
      <span className="ml-1 whitespace-nowrap text-xs font-semibold tabular-nums text-ink">
        {Math.min(current, total)} / {total}
      </span>
    </span>
  );
}
