"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Alerta, EstadoMesa, Mesa } from "@/lib/types";
import type { ArmazemHover } from "@/hooks/use-hover-mesa";
import type { ModoRotulos } from "@/lib/exibicao";
import { ROTULO_ALERTA, ROTULO_CURTO } from "@/lib/state";
import { cn } from "@/lib/utils";
import { estiloAlerta, GlifoAlerta } from "../selo-alerta";
import { ALTURA_ROTULO_3D, ALTURA_TAMPO } from "./cenarios";

export interface ItemRotulo {
  mesa: Mesa;
  estado: EstadoMesa;
  /** Já ordenados pela prioridade do selo. */
  alertas: Alerta[];
  x: number;
  z: number;
  /** Raio do tampo em metros, para medir o tamanho dele na tela. */
  raio: number;
  selecionada: boolean;
}

/** Pino só com o número: livre é tinta cheia (é o que a recepção procura), ocupada recua. */
function PinoCompacto({ i }: { i: ItemRotulo }) {
  const { mesa, estado } = i;

  return (
    <span
      style={{ transform: "translate(-13px, -50%)" }}
      className={cn(
        "tnum absolute top-0 left-0 grid size-[26px] place-items-center rounded-full border text-[13px] font-bold shadow-[0_1px_5px_rgba(0,0,0,0.22)]",
        estado === "livre" && "border-(--color-ink) bg-(--color-ink) text-(--color-surface)",
        estado === "reservada" && "border-[1.5px] border-(--color-ink-2) bg-(--color-surface) text-(--color-ink)",
        estado === "ocupada" && "border-(--color-line-2) bg-(--color-surface) text-(--color-ink-2) opacity-85",
        estado === "conta" && "border-2 border-(--color-conta-stroke) bg-(--color-surface) text-(--color-ink)",
      )}
    >
      {mesa.id}
    </span>
  );
}

/** Detalhe completo, só no hover e na seleção: número, estado e o alerta com os minutos. */
function Pilula({ i }: { i: ItemRotulo }) {
  const { mesa, estado, alertas, selecionada } = i;

  return (
    <div
      style={{ transform: "translate(-50%, -50%)" }}
      className={cn(
        "absolute top-0 left-0 flex h-8 items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-full border bg-(--color-surface) pl-3 text-[13px] font-semibold text-(--color-ink) shadow-[0_4px_14px_rgba(0,0,0,0.3)]",
        selecionada ? "border-[1.5px] border-(--color-ink)" : "border-(--color-line-2)",
        alertas.length === 0 && "pr-3",
      )}
    >
      <span className="tnum">Mesa {mesa.id}</span>
      <span className="font-medium text-(--color-ink-2)">· {ROTULO_CURTO[estado]}</span>
      {alertas[0] && (
        <span className="tnum ml-0.5 flex h-8 items-center gap-1 pr-3 pl-2 text-[12px] font-bold" style={estiloAlerta(alertas[0].tipo)}>
          <GlifoAlerta tipo={alertas[0].tipo} />
          {ROTULO_ALERTA[alertas[0].tipo]} {alertas[0].minutos}′
          {alertas.length > 1 && <span className="opacity-80">+{alertas.length - 1}</span>}
        </span>
      )}
    </div>
  );
}

/** Só o glifo do alerta mais urgente: o texto e os minutos ficam para a pílula. */
function Marcador({ alerta }: { alerta: Alerta }) {
  return (
    <span
      aria-hidden
      style={{ ...estiloAlerta(alerta.tipo), transform: "translate(-50%, -50%)" }}
      className="absolute top-0 left-0 grid size-3.5 place-items-center rounded-full text-[8.5px] shadow-[0_0_0_1.5px_rgba(255,255,255,0.85)]"
    >
      <GlifoAlerta tipo={alerta.tipo} className="size-2.5 tracking-tighter" />
    </span>
  );
}

export type MapaRotulos = Map<number, HTMLDivElement>;

/*
  Os rótulos são DOM comum sobre o canvas, posicionados por projeção só quando
  a câmera muda. O <Html> do drei criava uma raiz React por rótulo, e o
  desmonte dessas raízes durante a renderização quebrava o StrictMode.

  Cada item tem três camadas, e o projetor mostra o que a situação pede:
  [0] pino com o número (só com o tampo grande na tela), [1] pílula de detalhe
  (hover e seleção) e [2] marcador do alerta (sempre). Cada camada flutua acima
  da mesa, ligada ao tampo por um fio de 1px.
*/
const FADE = "opacity 150ms ease";
const OCULTO = { opacity: 0, visibility: "hidden" as const, pointerEvents: "none" as const };

export function CamadaRotulos({ itens, corHaste, els }: { itens: ItemRotulo[]; corHaste: string; els: React.RefObject<MapaRotulos> }) {
  const haste = <div className="absolute top-0 left-0 w-px" style={{ background: corHaste, opacity: 0.45 }} />;

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
        >
          <div style={{ ...OCULTO, transition: FADE }}>
            {haste}
            <PinoCompacto i={i} />
          </div>
          <div style={{ ...OCULTO, transition: FADE }}>
            {haste}
            <Pilula i={i} />
          </div>
          <div style={{ ...OCULTO, transition: FADE }}>
            {haste}
            {i.alertas[0] && <Marcador alerta={i.alertas[0]} />}
          </div>
        </div>
      ))}
    </div>
  );
}

const FOLGA = 4;
const CELULA = 64;
/** Diâmetro do tampo, em px, a partir do qual o pino com o número deixa de ser ruído. */
const DIAMETRO_MINIMO_PINO = 34;
const LADO_PINO = 26;
const LADO_MARCADOR = 14;
const DESLOCA_MARCADOR = 20;

/** Menor vence a disputa por espaço: alerta pela prioridade do selo, depois livre/reservada, conta e ocupada. */
function prioridade(i: ItemRotulo) {
  const a = i.alertas[0];
  if (a) return { semPedidoCritico: 1, entregaAtrasada: 2, semPedido: 3, contaParada: 4 }[a.tipo];
  return { livre: 5, reservada: 5, conta: 6, ocupada: 7 }[i.estado];
}

type Retangulo = { x0: number; y0: number; x1: number; y1: number };
type Candidato = { i: ItemRotulo; el: HTMLDivElement; x: number; y: number; yBase: number; diam: number; prof: number; rank: number };
type Estado = { pino: boolean | null; pilula: boolean | null; marcador: boolean | null; w: number; h: number };

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
 * Hover e seleção sempre mostram a pílula; o pino com o número segue o modo e disputa espaço
 * por prioridade (o que não cabe some); o marcador de alerta nunca disputa.
 */
export function ProjetorRotulos({
  itens,
  els,
  modo,
  hover,
  priorizarLivres = false,
}: {
  itens: ItemRotulo[];
  els: React.RefObject<MapaRotulos>;
  modo: ModoRotulos;
  hover: ArmazemHover;
  priorizarLivres?: boolean;
}) {
  const { camera, size, invalidate } = useThree();
  const atual = useRef(itens);
  atual.current = itens;
  const livres = useRef(priorizarLivres);
  livres.current = priorizarLivres;
  const modoAtual = useRef(modo);
  modoAtual.current = modo;
  const ultimo = useRef<{ m: number[]; w: number; h: number; l: boolean; modo: ModoRotulos; hov: number | null } | null>(null);
  // Ler offsetWidth força layout, então a pílula só é medida quando aparece. `null` = DOM em situação desconhecida, a ser reescrito.
  const estados = useRef(new WeakMap<HTMLDivElement, Estado>());

  // Mudou a lista (filtro, seleção, dados): os elementos e o conteúdo são novos, então o cache não vale.
  useEffect(() => {
    ultimo.current = null;
    estados.current = new WeakMap();
    invalidate();
  }, [itens, priorizarLivres, modo, invalidate]);

  useEffect(() => hover.assinar(invalidate), [hover, invalidate]);

  useFrame(() => {
    camera.updateMatrixWorld();
    const m = [...camera.matrixWorld.elements, (camera as THREE.PerspectiveCamera).projectionMatrix.elements[5]];
    const hov = hover.ler();
    const u = ultimo.current;
    if (
      u &&
      u.w === size.width &&
      u.h === size.height &&
      u.l === livres.current &&
      u.modo === modoAtual.current &&
      u.hov === hov &&
      u.m.every((v, k) => v === m[k])
    )
      return;
    ultimo.current = { m, w: size.width, h: size.height, l: livres.current, modo: modoAtual.current, hov };

    const topo = new THREE.Vector3();
    const base = new THREE.Vector3();
    const lado = new THREE.Vector3();
    const direita = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    const forcados: Candidato[] = [];
    const cands: Candidato[] = [];

    const mostra = (e: HTMLElement, v: boolean) => {
      e.style.opacity = v ? "1" : "0";
      // Ao esconder, a visibilidade espera o fade terminar.
      e.style.transition = v ? `${FADE}, visibility 0s` : `${FADE}, visibility 0s linear 150ms`;
      e.style.visibility = v ? "visible" : "hidden";
    };

    // Só toca o DOM de uma camada quando ela muda de situação.
    const aplica = (el: HTMLDivElement, pino: boolean, pilula: boolean, marcador: boolean) => {
      const e = estados.current.get(el)!;
      if (e.pino !== pino) mostra(el.children[0] as HTMLElement, (e.pino = pino));
      if (e.pilula !== pilula) mostra(el.children[1] as HTMLElement, (e.pilula = pilula));
      if (e.marcador !== marcador) mostra(el.children[2] as HTMLElement, (e.marcador = marcador));
    };

    const haste = (el: HTMLDivElement, camada: number, h: number) => {
      ((el.children[camada] as HTMLElement).firstElementChild as HTMLElement).style.height = `${Math.max(0, h)}px`;
    };

    for (const i of atual.current) {
      const el = els.current.get(i.mesa.id);
      if (!el) continue;

      if (!estados.current.has(el)) estados.current.set(el, { pino: null, pilula: null, marcador: null, w: 0, h: 0 });

      topo.set(i.x, ALTURA_ROTULO_3D, i.z).project(camera);
      if (topo.z > 1) {
        aplica(el, false, false, false);
        continue;
      }

      base.set(i.x, ALTURA_TAMPO + 0.03, i.z).project(camera);
      lado.set(i.x + direita.x * i.raio, ALTURA_TAMPO + 0.03 + direita.y * i.raio, i.z + direita.z * i.raio).project(camera);

      const c: Candidato = {
        i,
        el,
        x: (topo.x * 0.5 + 0.5) * size.width,
        y: (-topo.y * 0.5 + 0.5) * size.height,
        yBase: (-base.y * 0.5 + 0.5) * size.height,
        diam: Math.hypot((lado.x - base.x) * size.width * 0.5, (lado.y - base.y) * size.height * 0.5) * 2,
        prof: topo.z,
        rank: priorizarLivres && i.estado === "livre" ? -1 : prioridade(i),
      };

      if (i.selecionada || i.mesa.id === hov) forcados.push(c);
      else cands.push(c);
    }

    cands.sort((a, b) => a.rank - b.rank || a.prof - b.prof);
    const grade = new Grade();

    // A pílula entra primeiro na grade, para os pinos desviarem dela.
    for (const c of forcados) {
      const e = estados.current.get(c.el)!;
      if (e.w === 0) {
        const pilula = (c.el.children[1] as HTMLElement).children[1] as HTMLElement;
        e.w = pilula.offsetWidth;
        e.h = pilula.offsetHeight;
      }

      grade.insere({ x0: c.x - e.w / 2, y0: c.y - e.h / 2, x1: c.x + e.w / 2, y1: c.y + e.h / 2 });
      aplica(c.el, false, true, false);
      c.el.style.zIndex = c.i.mesa.id === hov ? "4" : "3";
      c.el.style.transform = `translate3d(${c.x}px, ${c.y}px, 0)`;
      haste(c.el, 1, c.yBase - c.y);
    }

    const comPino = new Set<Candidato>();
    for (const c of cands) {
      const quer = modoAtual.current === "sempre" || (modoAtual.current === "auto" && c.diam >= DIAMETRO_MINIMO_PINO);
      if (!quer) continue;

      const r = { x0: c.x - LADO_PINO / 2, y0: c.y - LADO_PINO / 2, x1: c.x + LADO_PINO / 2, y1: c.y + LADO_PINO / 2 };
      if (!dentroDaTela(r, size.width, size.height) || grade.colide(r)) continue;

      grade.insere(r);
      comPino.add(c);
    }

    const meio = LADO_MARCADOR / 2;
    for (const c of cands) {
      const pino = comPino.has(c);
      const alerta = c.i.alertas[0];
      const marcador =
        !!alerta && dentroDaTela({ x0: c.x - meio, y0: c.y - meio, x1: c.x + meio, y1: c.y + meio }, size.width, size.height);

      aplica(c.el, pino, false, marcador);
      if (!pino && !marcador) continue;

      c.el.style.zIndex = "1";
      c.el.style.transform = `translate3d(${c.x}px, ${c.y}px, 0)`;
      if (pino) haste(c.el, 0, c.yBase - c.y);
      if (marcador) {
        const camada = c.el.children[2] as HTMLElement;
        // Com o pino visível o marcador encosta nele, à direita, e dispensa o fio.
        camada.style.transform = pino ? `translateX(${DESLOCA_MARCADOR}px)` : "";
        (camada.firstElementChild as HTMLElement).style.display = pino ? "none" : "";
        if (!pino) haste(c.el, 2, c.yBase - c.y);
      }
    }
  });

  return null;
}
