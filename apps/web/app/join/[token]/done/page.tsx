import Link from "next/link";

export const instant = false;

// Pantalla neutra post-registro duplicado: no revela si el correo existía,
// solo indica que la tarjeta llega por email.
export default function JoinDone() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center bg-white px-6">
      <div className="rounded-2xl bg-neutral-50 p-8 text-center">
        <p className="text-lg font-semibold text-ink">Revisa tu correo</p>
        <p className="mt-2 text-sm text-ink-soft">
          Si ese correo ya estaba registrado, te acabamos de enviar el enlace a
          tu tarjeta. Si no lo ves en unos minutos, revisa la carpeta de spam.
        </p>
      </div>
      <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-neutral-300">
        Powered by
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/pineapple/isotipo.png" alt="" className="h-3.5 w-auto" />
        PineappleLoyalty — fidelización digital
      </p>
      <p className="mt-2 text-center">
        <Link href="/" className="text-[11px] text-neutral-300 underline-offset-2 hover:underline">
          ← Volver al inicio
        </Link>
      </p>
    </main>
  );
}
