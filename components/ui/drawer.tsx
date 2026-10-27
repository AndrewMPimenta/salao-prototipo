"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent, KeyboardEvent, ReactNode } from "react";

export interface DrawerProps {
  /** Alturas de repouso em px, crescentes. Ex.: [112, 0.5 * vh, 0.88 * vh] — o chamador calcula. */
  pontos: number[];
  /** Índice controlado do ponto atual. */
  indice: number;
  onIndiceChange: (i: number) => void;
  /** Sempre visível no topo (resumo/peek); a área de arrasto inclui o puxador e este cabeçalho. */
  cabecalho: ReactNode;
  children: ReactNode;
  /** aria-label da região. */
  rotulo: string;
  className?: string;
}

const LIMIAR = 8;
const DESACELERACAO = 0.998;
const OMEGA = (2 * Math.PI) / 0.42;

// Projeção de inércia da Apple: onde o dedo pararia se continuasse desacelerando.
const projetar = (v: number) => ((v / 1000) * DESACELERACAO) / (1 - DESACELERACAO);

const reduzMovimento = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function Drawer({ pontos, indice, onIndiceChange, cabecalho, children, rotulo, className }: DrawerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const altura = useRef(pontos[indice] ?? 0);
  const raf = useRef(0);
  const alvo = useRef<number | null>(null);
  const inicial = useRef(true);
  const arrasto = useRef<{ y0: number; h0: number; ativo: boolean; id: number; hist: { h: number; t: number }[] } | null>(null);
  const suprimirClique = useRef(false);

  const H = Math.max(...pontos, 0);
  const min = pontos[0] ?? 0;
  const ultimo = pontos.length - 1;

  const aplicar = useCallback(
    (h: number) => {
      altura.current = h;
      if (ref.current) ref.current.style.transform = `translate3d(0, ${H - h}px, 0)`;
    },
    [H],
  );

  const parar = useCallback(() => {
    cancelAnimationFrame(raf.current);
    const el = ref.current;
    if (el) {
      el.style.transition = "";
      el.style.willChange = "";
    }
  }, []);

  const animar = useCallback(
    (para: number, v0: number, zeta: number) => {
      parar();
      const el = ref.current;
      if (!el) return;
      if (reduzMovimento()) {
        el.style.transition = "transform 150ms ease-out";
        aplicar(para);
        return;
      }
      el.style.willChange = "transform";
      let v = v0;
      let t0 = performance.now();
      const passo = (agora: number) => {
        let resto = Math.min((agora - t0) / 1000, 0.05);
        t0 = agora;
        while (resto > 0) {
          const dt = Math.min(resto, 1 / 240);
          const x = altura.current - para;
          v += (-OMEGA * OMEGA * x - 2 * zeta * OMEGA * v) * dt;
          altura.current += v * dt;
          resto -= dt;
        }
        if (Math.abs(altura.current - para) < 0.3 && Math.abs(v) < 5) {
          aplicar(para);
          el.style.willChange = "";
          return;
        }
        aplicar(altura.current);
        raf.current = requestAnimationFrame(passo);
      };
      raf.current = requestAnimationFrame(passo);
    },
    [aplicar, parar],
  );

  // Mudança vinda de fora anima; a feita pelo próprio arrasto já está em curso (alvo igual).
  useLayoutEffect(() => {
    const destino = pontos[indice];
    if (destino === undefined) return;
    if (inicial.current) {
      inicial.current = false;
      aplicar(destino);
    } else if (alvo.current !== destino) {
      animar(destino, 0, 1);
    }
    alvo.current = destino;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice, pontos.join(",")]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const elastico = (h: number) => {
    const max = H;
    const o = h > max ? h - max : h < min ? min - h : 0;
    if (!o) return h;
    const r = (o * H * 0.55) / (H + 0.55 * o);
    return h > max ? max + r : min - r;
  };

  const aoPressionar = (e: ReactPointerEvent<HTMLDivElement>, doConteudo: boolean) => {
    if (e.button > 0 || (doConteudo && indice === ultimo)) return;
    parar();
    arrasto.current = { y0: e.clientY, h0: altura.current, ativo: false, id: e.pointerId, hist: [] };
  };

  const aoMover = (e: ReactPointerEvent<HTMLDivElement>) => {
    const a = arrasto.current;
    if (!a) return;
    const dh = a.y0 - e.clientY;
    if (!a.ativo) {
      if (Math.abs(dh) < LIMIAR) return;
      a.ativo = true;
      e.currentTarget.setPointerCapture(a.id);
      if (ref.current) ref.current.style.willChange = "transform";
    }
    const h = elastico(a.h0 + dh);
    a.hist.push({ h, t: e.timeStamp });
    if (a.hist.length > 8) a.hist.shift();
    aplicar(h);
  };

  const aoSoltar = (e: ReactPointerEvent<HTMLDivElement>) => {
    const a = arrasto.current;
    arrasto.current = null;
    if (!a?.ativo) return;
    suprimirClique.current = true;
    setTimeout(() => (suprimirClique.current = false), 0);

    const recente = a.hist.filter((p) => e.timeStamp - p.t <= 100);
    const ini = recente[0];
    const fim = recente[recente.length - 1];
    const dt = ini && fim ? fim.t - ini.t : 0;
    const v = dt > 0 ? ((fim.h - ini.h) / dt) * 1000 : 0;

    const projetado = altura.current + projetar(v);
    let melhor = 0;
    pontos.forEach((p, i) => {
      if (Math.abs(p - projetado) < Math.abs(pontos[melhor] - projetado)) melhor = i;
    });

    alvo.current = pontos[melhor];
    animar(pontos[melhor], v, Math.abs(v) > 1200 ? 0.85 : 1);
    if (melhor !== indice) onIndiceChange(melhor);
  };

  const eventosArrasto = (doConteudo: boolean) => ({
    onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => aoPressionar(e, doConteudo),
    onPointerMove: aoMover,
    onPointerUp: aoSoltar,
    onPointerCancel: aoSoltar,
  });

  const aoClicar = () => {
    if (suprimirClique.current) return;
    onIndiceChange(indice >= ultimo ? 0 : indice + 1);
  };

  const aoTeclar = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const prox = Math.min(ultimo, Math.max(0, indice + (e.key === "ArrowUp" ? 1 : -1)));
    if (prox !== indice) onIndiceChange(prox);
  };

  return (
    <div
      ref={ref}
      role="region"
      aria-label={rotulo}
      style={{ height: H, transform: `translate3d(0, ${H - altura.current}px, 0)` }}
      className={`glass fixed inset-x-0 bottom-0 z-30 flex flex-col rounded-t-[24px] ${className ?? ""}`}
    >
      <div className="shrink-0 touch-none select-none" {...eventosArrasto(false)}>
        <button
          type="button"
          aria-label={indice >= ultimo ? "Recolher painel" : "Expandir painel"}
          aria-expanded={indice > 0}
          onClick={aoClicar}
          onKeyDown={aoTeclar}
          className="mx-auto flex h-6 w-full cursor-grab items-center justify-center active:cursor-grabbing"
        >
          <span className="h-1 w-9 rounded-full bg-current opacity-25" />
        </button>
        {cabecalho}
      </div>
      <div
        className={`min-h-0 flex-1 overscroll-contain pb-[env(safe-area-inset-bottom)] ${
          indice === ultimo ? "touch-pan-y overflow-y-auto" : "touch-none overflow-y-hidden"
        }`}
        {...eventosArrasto(true)}
      >
        {children}
      </div>
    </div>
  );
}
