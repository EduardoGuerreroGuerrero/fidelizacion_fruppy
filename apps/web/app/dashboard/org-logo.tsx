"use client";

import { useEffect, useRef, useState } from "react";

// Logo de la organización con fallback: si la imagen no carga (URL rota o
// asset inaccesible) se muestran los children — las iniciales del comercio.
// El chequeo en useEffect cubre el caso en que la imagen falla antes de que
// React hidrate y adjunte el onError.
export function OrgLogo({
  src,
  className,
  children,
}: {
  src?: string | null;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (!src || failed) return <>{children}</>;
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      ref={ref}
      src={src}
      alt=""
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
