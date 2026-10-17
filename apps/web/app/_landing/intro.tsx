"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MAX_WAIT_MS = 10_000;
const FADE_MS = 450;

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
        className="absolute bottom-6 right-6 rounded-full border border-neutral-300 bg-white/80 px-4 py-1.5 text-xs font-medium text-ink-soft backdrop-blur transition hover:bg-white"
      >
        Omitir intro
      </button>
      {needsTap && (
        <p className="absolute inset-x-0 bottom-24 text-center text-sm font-medium text-pl-green/70">
          Toca la pantalla para ver el intro
        </p>
      )}
    </div>
  );
}
