"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MAX_WAIT_MS = 10_000;
const FADE_MS = 450;
// El intro se ve una vez por sesión: volver a "/" desde FAQ o legales no
// debe bloquear la landing otros 10 s.
const SEEN_KEY = "pl-intro-visto";

// Storage bloqueado (modo privado estricto): el intro se muestra igual.
function introYaVisto(): boolean {
  try {
    return window.sessionStorage.getItem(SEEN_KEY) !== null;
  } catch {
    return false;
  }
}

function marcarIntroVisto() {
  try {
    window.sessionStorage.setItem(SEEN_KEY, "1");
  } catch {}
}

/** Intro de marca: video a pantalla completa sobre la landing; se desvanece al terminar. */
export default function IntroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const finished = useRef(false);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    marcarIntroVisto();
    setLeaving(true);
    window.setTimeout(() => setGone(true), FADE_MS);
  }, []);

  // Reintenta play() ante políticas de autoplay (p. ej. iOS en modo ahorro).
  const tryPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || finished.current || !video.paused) return;
    video
      .play()
      .then(() => setNeedsTap(false))
      .catch(() => setNeedsTap(true));
  }, []);

  // Sin animación forzada: quien pide menos movimiento salta el intro de una
  // vez (la media query CSS ya reduce el fundido a ~0ms).
  useEffect(() => {
    if (introYaVisto()) {
      finished.current = true;
      const skip = window.setTimeout(() => setGone(true), 0);
      return () => window.clearTimeout(skip);
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timeout = window.setTimeout(finish, reduced ? 0 : MAX_WAIT_MS);
    return () => window.clearTimeout(timeout);
  }, [finish]);

  // Bloquea el scroll solo mientras el overlay está visible; se libera al
  // terminar (el componente retorna null sin desmontarse).
  useEffect(() => {
    if (gone) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [gone]);

  if (gone) return null;

  return (
    <div
      onPointerDown={tryPlay}
      className={`fixed inset-0 z-50 bg-white transition-opacity duration-500 ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {/* Nivel SaaS: intro PineappleLoyalty, sin marca de ningún comercio. */}
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        src="/pineapple/intro.mp4"
        poster="/pineapple/logo-vertical.png"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={finish}
        onError={finish}
        onCanPlay={tryPlay}
      />
      <button
        type="button"
        onClick={finish}
        className="absolute bottom-8 right-6 rounded-full border border-pl-green/20 bg-white/90 px-4 py-2 text-sm font-semibold text-pl-green shadow-sm transition hover:border-pl-green hover:bg-white"
      >
        Saltar intro
      </button>
      {needsTap && (
        <p className="absolute inset-x-0 bottom-24 text-center text-sm font-medium text-pl-green/70">
          Toca la pantalla para ver el intro
        </p>
      )}
    </div>
  );
}
