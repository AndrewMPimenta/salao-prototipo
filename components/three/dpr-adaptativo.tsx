"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

const JANELA = 40;
const PASSO = 0.25;
const MS_LENTO = 22.2;
const MS_RAPIDO = 17.5;

/**
 * Baixa a densidade de pixels só quando a cena anda abaixo de ~45 fps e a devolve depois de um bom tempo estável. Com
 * frameloop sob demanda, intervalos longos entre quadros são pausa, não lentidão: só contam quadros seguidos.
 * Depois de duas quedas não volta mais a subir, para não ficar oscilando numa máquina que não dá conta.
 */
export function DprAdaptativo() {
  const get = useThree((s) => s.get);
  const setDpr = useThree((s) => s.setDpr);
  const invalidate = useThree((s) => s.invalidate);
  const est = useRef({ soma: 0, n: 0, lentas: 0, rapidas: 0, quedas: 0, ultimaQueda: 0 });

  useFrame((_, delta) => {
    const e = est.current;
    if (delta > 0.1) {
      e.soma = 0;
      e.n = 0;
      return;
    }
    e.soma += delta * 1000;
    if (++e.n < JANELA) return;
    const media = e.soma / e.n;
    e.soma = 0;
    e.n = 0;

    const { dpr, initialDpr } = get().viewport;
    const teto = initialDpr || dpr;
    const agora = performance.now();
    if (media > MS_LENTO) {
      e.rapidas = 0;
      if (++e.lentas >= 2 && dpr > 1) {
        e.lentas = 0;
        e.quedas++;
        e.ultimaQueda = agora;
        setDpr(Math.max(1, dpr - PASSO));
        invalidate();
      }
    } else if (media < MS_RAPIDO) {
      e.lentas = 0;
      if (++e.rapidas >= 5 && dpr < teto && e.quedas < 2 && agora - e.ultimaQueda > 15000) {
        e.rapidas = 0;
        setDpr(Math.min(teto, dpr + PASSO));
        invalidate();
      }
    } else {
      e.lentas = 0;
      e.rapidas = 0;
    }
  });

  return null;
}
