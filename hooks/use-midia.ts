"use client";

import { useSyncExternalStore } from "react";

/**
 * Devolve `null` até a hidratação terminar. O layout escolhe entre dois
 * esqueletos de interface completamente diferentes; adivinhar no servidor
 * faria o celular piscar o layout de desktop.
 */
export function useMidia(consulta: string): boolean | null {
  return useSyncExternalStore<boolean | null>(
    (aviso) => {
      const m = window.matchMedia(consulta);
      m.addEventListener("change", aviso);
      return () => m.removeEventListener("change", aviso);
    },
    () => window.matchMedia(consulta).matches,
    () => null,
  );
}
