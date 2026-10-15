"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_WAIT_MS = 15_000;
const FADE_MS = 450;

export default function Home() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [leaving, setLeaving] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const finished = useRef(false);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    setLeaving(true);
    window.setTimeout(() => router.replace("/login"), FADE_MS);
  }, [router]);

  // Reintenta play() ante políticas de autoplay (p. ej. iOS en modo ahorro).
  const tryPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || finished.current || !video.paused) return;
    video
      .play()
      .then(() => setNeedsTap(false))
      .catch(() => setNeedsTap(true));
  }, []);

  useEffect(() => {
    router.prefetch("/login");
    const timeout = window.setTimeout(finish, MAX_WAIT_MS);
    return () => window.clearTimeout(timeout);
  }, [finish, router]);

  return (
    <main
      onPointerDown={tryPlay}
      className={`fixed inset-0 z-50 bg-white transition-opacity duration-500 ${
        leaving ? "opacity-0" : "opacity-100"
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
      {needsTap && (
        <p className="absolute inset-x-0 bottom-24 text-center text-sm font-medium text-pl-green/70">
          Toca la pantalla para ver el intro
        </p>
      )}
      <button
        type="button"
        onClick={finish}
        className="absolute right-6 bottom-6 rounded-full bg-white/80 px-5 py-2 text-sm font-medium text-pl-green shadow-sm ring-1 ring-pl-green/20 backdrop-blur transition hover:bg-white"
      >
        Omitir
      </button>
    </main>
  );
}
