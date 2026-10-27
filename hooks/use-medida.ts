"use client";

import { useLayoutEffect, useState } from "react";

export interface Medida {
  w: number;
  h: number;
}

/**
 * Mede por offsetWidth/offsetHeight, que ignoram transform: painéis que
 * entram com translate/scale não distorcem o enquadramento da câmera.
 */
export function useMedida() {
  const [el, setEl] = useState<HTMLElement | null>(null);
  const [medida, setMedida] = useState<Medida>({ w: 0, h: 0 });

  useLayoutEffect(() => {
    if (!el) return;
    const medir = () =>
      setMedida((a) => (a.w === el.offsetWidth && a.h === el.offsetHeight ? a : { w: el.offsetWidth, h: el.offsetHeight }));
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => obs.disconnect();
  }, [el]);

  return [setEl, medida] as const;
}

export interface Janela {
  w: number;
  h: number;
  seguro: { topo: number; base: number; esquerda: number; direita: number };
}

const INICIAL: Janela = { w: 0, h: 0, seguro: { topo: 0, base: 0, esquerda: 0, direita: 0 } };

/** Viewport e áreas seguras em px; o CSS só enxerga `env()`, o enquadramento precisa do número. */
export function useJanela(): Janela {
  const [janela, setJanela] = useState<Janela>(INICIAL);

  useLayoutEffect(() => {
    const sonda = document.createElement("div");
    sonda.setAttribute("aria-hidden", "true");
    sonda.style.cssText =
      "position:fixed;inset:0;visibility:hidden;pointer-events:none;" +
      "padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)";
    document.body.appendChild(sonda);

    const ler = () => {
      const c = getComputedStyle(sonda);
      setJanela({
        w: window.innerWidth,
        h: window.innerHeight,
        seguro: {
          topo: parseFloat(c.paddingTop) || 0,
          base: parseFloat(c.paddingBottom) || 0,
          esquerda: parseFloat(c.paddingLeft) || 0,
          direita: parseFloat(c.paddingRight) || 0,
        },
      });
    };
    ler();
    window.addEventListener("resize", ler);
    return () => {
      window.removeEventListener("resize", ler);
      sonda.remove();
    };
  }, []);

  return janela;
}
