"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Alerta, EstadoMesa, Mesa } from "@/lib/types";
import { ROTULO_CURTO, ROTULO_ALERTA } from "@/lib/state";
import { cn } from "@/lib/utils";
import { estiloAlerta, SeloAlerta } from "../selo-alerta";
import { ALTURA_ROTULO_3D, ALTURA_TAMPO } from "./cenarios";
import type { Par } from "./materiais";

export interface ItemRotulo {
  mesa: Mesa;
  estado: EstadoMesa;
  /** Já ordenados pela prioridade do selo. */
  alertas: Alerta[];
  par: Par;
  x: number;
  z: number;
  selecionada: boolean;
}

/**
 * Pino de 26px com o número. Livre é tinta cheia (luminância máxima, sem matiz
 * nova) porque é o que a recepção procura; reservada vira contorno com o
 * horário; ocupada recua. Só o alerta mais urgente ganha selo, colado à direita.
 * Selecionada expande com lugares e situação.
 */
function Pino({ i }: { i: ItemRotulo }) {
  const { mesa, estado, alertas, selecionada } = i;

  if (selecionada) {
    return (
      <div
        className="flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-full border-[1.5px] border-(--color-ink) bg-(--color-surface) px-3.5 py-1 text-[15px] font-semibold text-(--color-ink) shadow-[0_4px_14px_rgba(0,0,0,0.3)]"
        style={{ transform: "translate(-50%, -50%)" }}
      >
        <span className="tnum">Mesa {mesa.id}</span>
        <span className="font-medium text-(--color-ink-2)">
          · {mesa.lugares} lugares · {alertas[0] ? ROTULO_ALERTA[alertas[0].tipo] : ROTULO_CURTO[estado]}
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center"
      style={{ transform: "translate(-13px, -50%)" }}
    >
      <span
        className={cn(
          "tnum z-10 grid size-[26px] flex-none place-items-center rounded-full border text-[13px] font-bold shadow-[0_1px_5px_rgba(0,0,0,0.22)]",
          estado === "livre" && "border-(--color-ink) bg-(--color-ink) text-(--color-surface)",
          estado === "reservada" && "border-[1.5px] border-(--color-ink-2) bg-(--color-surface) text-(--color-ink)",
          estado === "ocupada" && "border-(--color-line-2) bg-(--color-surface) text-(--color-ink-2) opacity-85",
          estado === "conta" && "border-2 border-(--color-conta-stroke) bg-(--color-surface) text-(--color-ink)",
        )}
      >
        {mesa.id}
      </span>
      {estado === "reservada" && mesa.reserva && (
        <span className="tnum -ml-2 flex h-5 items-center rounded-r-full border border-l-0 border-(--color-ink-2) bg-(--color-surface) pr-2 pl-3 text-[11px] font-bold whitespace-nowrap text-(--color-ink)">
          {mesa.reserva.hora}
        </span>
      )}
      <SeloAlerta alertas={alertas} className="-ml-2 rounded-r-full pr-2 pl-3" />
    </div>
  );
}

export type MapaRotulos = Map<number, HTMLDivElement>;

/*
  Os rótulos são DOM comum sobre o canvas, posicionados por projeção só quando
  a câmera muda. O <Html> do drei criava uma raiz React por rótulo, e o
  desmonte dessas raízes durante a renderização quebrava o StrictMode.

  Cada rótulo flutua acima da mesa, ligado ao tampo por um fio de 1px, para a
  mesa continuar visível embaixo. Cada item tem dois níveis de detalhe, pino
  (fio + Pino) e ponto, e o projetor mostra no máximo um deles.
*/
const FADE = "opacity 150ms ease";
const OCULTO = { opacity: 0, visibility: "hidden" as const, pointerEvents: "none" as const };

export function CamadaRotulos({ itens, corHaste, els }: { itens: ItemRotulo[]; corHaste: string; els: React.RefObject<MapaRotulos> }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {itens.map((i) => (
        <div
          key={i.mesa.id}
          ref={(el) => {
            if (el) els.current.set(i.mesa.id, el);
            else els.current.delete(i.mesa.id);
          }}
          className="absolute top-0 left-0 will-change-transform"
          style={{ zIndex: i.selecionada ? 2 : 1 }}
        >
          <div style={{ ...OCULTO, transition: FADE }}>
            <div className="absolute top-0 left-0 w-px" style={{ background: corHaste, opacity: 0.45 }} />
            <Pino i={i} />
          </div>
          <div
            className="absolute top-0 left-0 box-border size-2 rounded-full border-[1.5px]"
            style={{
              ...OCULTO,
              transition: FADE,
              transform: "translate(-50%, -50%)",
              ...(i.alertas[0]
                ? { ...estiloAlerta(i.alertas[0].tipo), borderColor: "transparent" }
                : {
                    background: i.estado === "livre" ? "var(--color-ink)" : `var(--color-${i.estado}-fill)`,
                    borderColor: i.estado === "livre" ? "var(--color-ink)" : `var(--color-${i.estado}-stroke)`,
                  }),
            }}
          />
        </div>
      ))}
    </div>
  );
}

const FOLGA = 4;
const CELULA = 64;
const LADO_PONTO = 8;
/** Menor vence a disputa por espaço: alerta pela prioridade do selo, depois livre/reservada, conta e ocupada. */
function prioridade(i: ItemRotulo) {
  const a = i.alertas[0];
  if (a) return { semPedidoCritico: 1, entregaAtrasada: 2, semPedido: 3, contaParada: 4 }[a.tipo];
  return { livre: 5, reservada: 5, conta: 6, ocupada: 7 }[i.estado];
}

type Retangulo = { x0: number; y0: number; x1: number; y1: number };
type Candidato = { i: ItemRotulo; el: HTMLDivElement; x: number; y: number; yBase: number; prof: number; rank: number };
type Medida = { modo: 0 | 1 | 2; w: number; h: number };

/** Grade de buckets: consulta e inserção só tocam as células que o retângulo cobre. */
class Grade {
  private celulas = new Map<number, Retangulo[]>();

  private chaves(r: Retangulo) {
    const out: number[] = [];
    for (let cx = Math.floor(r.x0 / CELULA); cx <= Math.floor(r.x1 / CELULA); cx++)
      for (let cy = Math.floor(r.y0 / CELULA); cy <= Math.floor(r.y1 / CELULA); cy++) out.push(cx * 100003 + cy);
    return out;
  }

  colide(r: Retangulo) {
    const g = { x0: r.x0 - FOLGA, y0: r.y0 - FOLGA, x1: r.x1 + FOLGA, y1: r.y1 + FOLGA };
    for (const k of this.chaves(g)) {
      for (const o of this.celulas.get(k) ?? []) {
        if (g.x0 < o.x1 && g.x1 > o.x0 && g.y0 < o.y1 && g.y1 > o.y0) return true;
      }
    }
    return false;
  }

  insere(r: Retangulo) {
    for (const k of this.chaves(r)) {
      const l = this.celulas.get(k);
      if (l) l.push(r);
      else this.celulas.set(k, [r]);
    }
  }
}

function dentroDaTela(r: Retangulo, w: number, h: number) {
  return r.x1 > 0 && r.y1 > 0 && r.x0 < w && r.y0 < h;
}

/**
 * Roda dentro do Canvas, onde a câmera está, e escreve a posição de cada rótulo direto no DOM.
 * Posicionamento guloso por prioridade: o pino que não cabe vira ponto, e o ponto que não cabe some.
 */
export function ProjetorRotulos({
  itens,
  els,
  priorizarLivres = false,
}: {
  itens: ItemRotulo[];
  els: React.RefObject<MapaRotulos>;
  priorizarLivres?: boolean;
}) {
  const { camera, size, invalidate } = useThree();
  const atual = useRef(itens);
  atual.current = itens;
  const livres = useRef(priorizarLivres);
  livres.current = priorizarLivres;
  const ultimo = useRef<{ m: number[]; w: number; h: number; l: boolean } | null>(null);
  // Ler offsetWidth força layout, então o tamanho de cada pino só é refeito quando o conteúdo muda.
  const medidas = useRef(new WeakMap<HTMLDivElement, Medida>());

  // Mudou a lista (filtro, seleção, dados): os elementos e o conteúdo são novos, então o cache não vale.
  useEffect(() => {
    ultimo.current = null;
    medidas.current = new WeakMap();
    invalidate();
  }, [itens, priorizarLivres, invalidate]);

  useFrame(() => {
    camera.updateMatrixWorld();
    const m = [...camera.matrixWorld.elements, (camera as THREE.PerspectiveCamera).projectionMatrix.elements[5]];
    const u = ultimo.current;
    if (u && u.w === size.width && u.h === size.height && u.l === livres.current && u.m.every((v, k) => v === m[k])) return;
    ultimo.current = { m, w: size.width, h: size.height, l: livres.current };

    const topo = new THREE.Vector3();
    const base = new THREE.Vector3();
    const cands: Candidato[] = [];

    const aplica = (el: HTMLDivElement, modo: 0 | 1 | 2) => {
      const med = medidas.current.get(el)!;
      if (med.modo === modo) return;
      med.modo = modo;

      const mostra = (e: HTMLElement, v: boolean) => {
        e.style.opacity = v ? "1" : "0";
        // Ao esconder, a visibilidade espera o fade terminar.
        e.style.transition = v ? `${FADE}, visibility 0s` : `${FADE}, visibility 0s linear 150ms`;
        e.style.visibility = v ? "visible" : "hidden";
      };
      mostra(el.children[0] as HTMLElement, modo === 1);
      mostra(el.children[1] as HTMLElement, modo === 2);
    };

    for (const i of atual.current) {
      const el = els.current.get(i.mesa.id);
      if (!el) continue;

      if (!medidas.current.has(el)) {
        const pino = (el.children[0] as HTMLElement).children[1] as HTMLElement;
        medidas.current.set(el, { modo: 0, w: pino.offsetWidth, h: pino.offsetHeight });
      }

      topo.set(i.x, ALTURA_ROTULO_3D, i.z).project(camera);
      if (topo.z > 1) {
        aplica(el, 0);
        continue;
      }
      base.set(i.x, ALTURA_TAMPO + 0.03, i.z).project(camera);

      const rank = i.selecionada ? -2 : priorizarLivres && i.estado === "livre" ? -1 : prioridade(i);
      cands.push({
        i,
        el,
        x: (topo.x * 0.5 + 0.5) * size.width,
        y: (-topo.y * 0.5 + 0.5) * size.height,
        yBase: (-base.y * 0.5 + 0.5) * size.height,
        prof: topo.z,
        rank,
      });
    }

    cands.sort((a, b) => a.rank - b.rank || a.prof - b.prof);

    const grade = new Grade();
    const semPino: Candidato[] = [];

    for (const c of cands) {
      const { w, h } = medidas.current.get(c.el)!;
      const sel = c.i.selecionada;
      const x0 = sel ? c.x - w / 2 : c.x - 13;
      const r = { x0, y0: c.y - h / 2, x1: x0 + w, y1: c.y + h / 2 };

      if (!sel && (!dentroDaTela(r, size.width, size.height) || grade.colide(r))) {
        semPino.push(c);
        continue;
      }

      grade.insere(r);
      aplica(c.el, 1);
      c.el.style.transform = `translate3d(${c.x}px, ${c.y}px, 0)`;
      (c.el.children[0].firstElementChild as HTMLElement).style.height = `${Math.max(0, c.yBase - c.y)}px`;
    }

    // Pontos só entram depois de todos os pinos, para não tirarem o lugar de um pino que caberia.
    const meio = LADO_PONTO / 2;
    for (const c of semPino) {
      const r = { x0: c.x - meio, y0: c.y - meio, x1: c.x + meio, y1: c.y + meio };
      if (!dentroDaTela(r, size.width, size.height) || grade.colide(r)) {
        aplica(c.el, 0);
        continue;
      }

      grade.insere(r);
      aplica(c.el, 2);
      c.el.style.transform = `translate3d(${c.x}px, ${c.y}px, 0)`;
    }
  });

  return null;
}
