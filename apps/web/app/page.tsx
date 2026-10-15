"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const INTRO_TIMEOUT_MS = 12_000;
const FADE_MS = 450;

export default function Home() {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const finished = useRef(false);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    setLeaving(true);
    window.setTimeout(() => router.replace("/login"), FADE_MS);
  }, [router]);

  useEffect(() => {
    router.prefetch("/login");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }
    const timeout = window.setTimeout(finish, INTRO_TIMEOUT_MS);
    return () => window.clearTimeout(timeout);
  }, [finish, router]);

  return (
    <main
      className={`fixed inset-0 z-50 bg-white transition-opacity duration-500 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Nivel SaaS: intro PineappleLoyalty, sin marca de ningún comercio. */}
      <video
        className="h-full w-full object-contain"
        src="/pineapple/intro.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={finish}
        onError={finish}
        onCanPlay={(e) => {
          e.currentTarget.play().catch(finish);
        }}
      />
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
