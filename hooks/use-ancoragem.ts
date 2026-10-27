"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";

export type Lado = "esquerda" | "direita" | "cima" | "baixo";

const FOLGA = 8;
const MARGEM = 8;

/**
 * Posiciona um popover ao lado do botão que o abre, do lado pedido, e o
 * empurra para dentro da janela. A origem da transformação vira o centro
 * do botão, de onde o vidro "nasce".
 */
export function useAncoragem(aberto: boolean, lado: Lado, revisar?: string) {
  const botao = useRef<HTMLDivElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const [estilo, setEstilo] = useState<CSSProperties>({ left: 0, top: 0 });

  useLayoutEffect(() => {
    const b = botao.current;
    const p = pop.current;
    if (!aberto || !b || !p) return;

    const calcular = () => {
      const r = b.getBoundingClientRect();
      const w = p.offsetWidth;
      const h = p.offsetHeight;
      const bw = b.offsetWidth;
      const bh = b.offsetHeight;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let left: number;
      let top: number;
      if (lado === "direita" || lado === "esquerda") {
        left = lado === "direita" ? bw + FOLGA : -(w + FOLGA);
        top = bh / 2 - h / 2;
      } else {
        top = lado === "baixo" ? bh + FOLGA : -(h + FOLGA);
        left = bw - w;
      }

      left += Math.min(0, vw - MARGEM - (r.left + left + w)) + Math.max(0, MARGEM - (r.left + left));
      top += Math.min(0, vh - MARGEM - (r.top + top + h)) + Math.max(0, MARGEM - (r.top + top));

      setEstilo({ left, top, transformOrigin: `${bw / 2 - left}px ${bh / 2 - top}px` });
    };

    calcular();
    window.addEventListener("resize", calcular);
    return () => window.removeEventListener("resize", calcular);
  }, [aberto, lado, revisar]);

  return { botao, pop, estilo };
}
