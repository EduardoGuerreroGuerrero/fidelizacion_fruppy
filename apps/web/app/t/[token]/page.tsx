import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

type CardPublic = {
  org_name: string;
  first_name: string;
  program_name: string;
  program_type: "stamps" | "points";
  stamp_goal: number | null;
  current_stamps: number;
  current_points: number;
  card_status: string;
};

// Página pública de la tarjeta. El token de 144 bits ES el credential:
// no expone email, teléfono ni apellido — solo progreso del programa.
export default async function CardPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_card_public", { p_token: token });
  const card = data as CardPublic | null;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const qrDataUrl = await QRCode.toDataURL(`${baseUrl}/t/${token}`, {
    width: 220,
    margin: 1,
  });

  if (!card) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p className="rounded-lg border border-neutral-200 p-8 text-center text-neutral-500 dark:border-neutral-800">
          Tarjeta no encontrada.
        </p>
      </main>
    );
  }

  const revoked = card.card_status !== "active";
  const progress =
    card.program_type === "stamps" && card.stamp_goal
      ? `${card.current_stamps} / ${card.stamp_goal} sellos`
      : `${card.current_points} puntos`;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div
        className={`w-full max-w-sm rounded-2xl border p-8 text-center shadow-sm ${
          revoked
            ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
            : "border-neutral-200 dark:border-neutral-800"
        }`}
      >
        <p className="text-sm uppercase tracking-wide text-neutral-500">{card.org_name}</p>
        <h1 className="mt-1 text-2xl font-semibold">{card.program_name}</h1>
        <p className="mt-1 text-sm text-neutral-500">{card.first_name}</p>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt="QR de la tarjeta"
          width={220}
          height={220}
          className="mx-auto my-5 rounded-lg"
        />

        <p className="text-3xl font-bold tabular-nums">{progress}</p>

        {revoked && (
          <p className="mt-4 rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-800 dark:bg-red-900/50 dark:text-red-300">
            Tarjeta revocada — solicita una nueva en el comercio.
          </p>
        )}
      </div>
      <p className="text-xs text-neutral-400">
        Powered by Fruppy — tarjeta digital de fidelización
      </p>
    </main>
  );
}
