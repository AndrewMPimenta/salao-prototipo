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
import type { Folga } from "./enquadramento";
import { ALTURA_TAMPO, type Marco } from "./cenarios";

export interface ItemRotulo {
  mesa: Mesa;
  estado: EstadoMesa;
  /** Já ordenados pela prioridade do selo. */
  alertas: Alerta[];
  x: number;
  z: number;
  /** Raio do tampo em metros, para medir o tamanho dele na tela. */
  raio: number;
  /** Fora do foco ou do filtro: o número some, mas o hover ainda explica a mesa. */
  esmaecida: boolean;
  selecionada: boolean;
}

/** Só o número, no modo "Sempre": discreto, centrado no tampo. */
function Numero({ i }: { i: ItemRotulo }) {
  return (
    <span
      style={{ transform: "translate(-50%, -50%)" }}
      className="tnum absolute top-0 left-0 grid h-[22px] min-w-[22px] place-items-center rounded-full bg-(--color-surface)/92 px-1.5 text-[12px] font-semibold text-(--color-ink) shadow-[0_1px_4px_rgba(0,0,0,0.18)]"
    >
      {i.mesa.id}
    </span>
  );
}

/** Pílula do hover: número, estado e o alerta principal com os minutos. */
function Pilula({ i }: { i: ItemRotulo }) {
  const { mesa, estado, alertas } = i;

  return (
    <div className="absolute top-0 left-0 flex h-8 items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-full border border-(--color-line-2) bg-(--color-surface) pl-3 text-[13px] font-semibold text-(--color-ink) shadow-[0_4px_14px_rgba(0,0,0,0.22)]">
      <span className={cn("tnum", alertas.length === 0 && "pr-0")}>Mesa {mesa.id}</span>
      <span className={cn("font-medium text-(--color-ink-2)", alertas.length === 0 && "pr-3")}>· {ROTULO_CURTO[estado]}</span>
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

export type MapaRotulos = Map<number, HTMLDivElement>;

/*
  Os rótulos são DOM comum sobre o canvas, posicionados por projeção no mesmo quadro da
  câmera. Cada item tem duas camadas: [0] o número (só no modo "Sempre") e [1] a pílula
  do hover, que fica acima da mesa, nunca sobre o tampo. A mesa em foco não tem rótulo:
  o holofote a identifica e o número está no cartão.
*/
const FADE = "opacity 150ms ease";
const OCULTO = { opacity: 0, visibility: "hidden" as const, pointerEvents: "none" as const };

export function CamadaRotulos({
  itens,
  marcos,
  corHaste,
  els,
  elsMarcos,
}: {
  itens: ItemRotulo[];
  marcos: Marco[];
  corHaste: string;
  els: React.RefObject<MapaRotulos>;
  elsMarcos: React.RefObject<(HTMLDivElement | null)[]>;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {/* Nome dos marcos do cenário: a voz mais baixa da cena, sob as mesas na disputa por espaço. */}
      {marcos.map((m, k) => (
        <div
          key={m.nome}
          ref={(el) => {
            elsMarcos.current[k] = el;
          }}
          style={{ ...OCULTO, transition: FADE }}
          className="absolute top-0 left-0 whitespace-nowrap rounded-full bg-(--color-surface)/72 px-2 py-0.5 text-[10.5px] font-semibold tracking-[0.06em] text-(--color-ink-2) uppercase shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
        >
          {m.nome}
        </div>
      ))}
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
            <Numero i={i} />
          </div>
          <div style={{ ...OCULTO, transition: FADE }}>
            <div className="absolute left-0 w-px" style={{ background: corHaste, opacity: 0.4 }} />
            <Pilula i={i} />
          </div>
        </div>
      ))}
    </div>
  );
}

const FOLGA = 4;
const CELULA = 64;
/** Diâmetro do tampo, em px, abaixo do qual o número vira ruído. */
const DIAMETRO_MINIMO_NUMERO = 16;
const LADO_NUMERO = 22;
const VAO = 12;
/** Raio que envolve o tampo e as cadeiras, além do raio do tampo. */
const ALEM_DO_TAMPO = 0.55;

type Retangulo = { x0: number; y0: number; x1: number; y1: number };
type Estado = { numero: boolean | null; pilula: boolean | null; w: number; h: number };

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

/** Menor vence a disputa por espaço: mesa com alerta, depois livre/reservada, conta e ocupada. */
function prioridade(i: ItemRotulo) {
  if (i.alertas[0]) return 0;
  return { livre: 1, reservada: 1, conta: 2, ocupada: 3 }[i.estado];
}

/**
 * Roda dentro do Canvas, depois do controle de câmera (prioridade 0, o controle atualiza em -1),
 * e escreve a posição de cada rótulo direto no DOM no mesmo quadro em que a cena é desenhada.
 */
export function ProjetorRotulos({
  itens,
  els,
  modo,
  hover,
  folga,
  marcos,
  elsMarcos,
  foco,
}: {
  itens: ItemRotulo[];
  marcos: Marco[];
  elsMarcos: React.RefObject<(HTMLDivElement | null)[]>;
  /** Com uma mesa em foco, os marcos recuam junto com o resto da sala. */
  foco: boolean;
  els: React.RefObject<MapaRotulos>;
  modo: ModoRotulos;
  hover: ArmazemHover;
  folga: Folga;
}) {
  const { camera, size, invalidate } = useThree();
  const atual = useRef({ itens, modo, folga, marcos, foco });
  atual.current = { itens, modo, folga, marcos, foco };
  const tamMarcos = useRef(new WeakMap<HTMLDivElement, { w: number; h: number; vis: number }>());
  const ultimo = useRef<{ m: number[]; hov: number | null } | null>(null);
  // Ler offsetWidth força layout, então a pílula só é medida quando aparece. `null` = DOM em situação desconhecida.
  const estados = useRef(new WeakMap<HTMLDivElement, Estado>());

  // Mudou a lista (filtro, foco, dados): os elementos e o conteúdo são novos, então o cache não vale.
  useEffect(() => {
    ultimo.current = null;
    estados.current = new WeakMap();
    invalidate();
  }, [itens, modo, folga.topo, marcos, foco, invalidate]);

  useEffect(() => hover.assinar(invalidate), [hover, invalidate]);

  useFrame(() => {
    camera.updateMatrixWorld();
    const proj = (camera as THREE.PerspectiveCamera).projectionMatrix.elements;
    const m = [...camera.matrixWorld.elements, proj[0], proj[5], size.width, size.height];
    const hov = hover.ler();
    const u = ultimo.current;
    if (u && u.hov === hov && u.m.every((v, k) => v === m[k])) return;
    ultimo.current = { m, hov };

    const { itens: lista, modo: modoAtual, folga: f, marcos: listaMarcos, foco: emFoco } = atual.current;
    const v = new THREE.Vector3();
    const cima = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
    const direita = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    const tela = (p: THREE.Vector3) => ({ x: (p.x * 0.5 + 0.5) * size.width, y: (-p.y * 0.5 + 0.5) * size.height, z: p.z });
    const grade = new Grade();

    const mostra = (e: HTMLElement, vis: boolean) => {
      e.style.opacity = vis ? "1" : "0";
      // Ao esconder, a visibilidade espera o fade terminar.
      e.style.transition = vis ? `${FADE}, visibility 0s` : `${FADE}, visibility 0s linear 150ms`;
      e.style.visibility = vis ? "visible" : "hidden";
    };

    const aplica = (el: HTMLDivElement, numero: boolean, pilula: boolean) => {
      let e = estados.current.get(el);
      if (!e) estados.current.set(el, (e = { numero: null, pilula: null, w: 0, h: 0 }));
      if (e.numero !== numero) mostra(el.children[0] as HTMLElement, (e.numero = numero));
      if (e.pilula !== pilula) mostra(el.children[1] as HTMLElement, (e.pilula = pilula));
      return e;
    };

    // A pílula do hover entra primeiro na grade, para os números desviarem dela.
    const daVez = hov === null ? undefined : lista.find((i) => i.mesa.id === hov && !i.selecionada);
    if (daVez) {
      const el = els.current.get(daVez.mesa.id);
      const centro = tela(v.set(daVez.x, ALTURA_TAMPO, daVez.z).project(camera));
      if (el && centro.z <= 1) {
        const e = aplica(el, false, true);
        const camada = el.children[1] as HTMLElement;
        const pilula = camada.children[1] as HTMLElement;
        if (e.w === 0) {
          e.w = pilula.offsetWidth;
          e.h = pilula.offsetHeight;
        }

        // Topo e base da esfera que envolve mesa e cadeiras, na tela.
        const r = daVez.raio + ALEM_DO_TAMPO;
        const topo = tela(v.set(daVez.x, ALTURA_TAMPO, daVez.z).addScaledVector(cima, r).project(camera));
        const base = tela(v.set(daVez.x, ALTURA_TAMPO, daVez.z).addScaledVector(cima, -r).project(camera));
        const acima = topo.y - VAO - e.h >= f.topo;
        const y0 = acima ? topo.y - VAO - e.h : base.y + VAO;
        const x0 = Math.min(Math.max(centro.x - e.w / 2, f.esquerda), size.width - f.direita - e.w);

        el.style.zIndex = "4";
        el.style.transform = `translate3d(${centro.x}px, ${y0}px, 0)`;
        pilula.style.transform = `translateX(${x0 - centro.x}px)`;
        const haste = camada.children[0] as HTMLElement;
        haste.style.top = acima ? `${e.h}px` : `${-VAO}px`;
        haste.style.height = `${VAO}px`;
        grade.insere({ x0, y0, x1: x0 + e.w, y1: y0 + e.h });
      }
    }

    const candidatos: { i: ItemRotulo; el: HTMLDivElement; x: number; y: number; prof: number }[] = [];
    for (const i of lista) {
      const el = els.current.get(i.mesa.id);
      if (!el || i === daVez) continue;

      const quer = modoAtual === "sempre" && !i.esmaecida && !i.selecionada;
      if (!quer) {
        aplica(el, false, false);
        continue;
      }

      const c = tela(v.set(i.x, ALTURA_TAMPO, i.z).project(camera));
      const lado = tela(v.set(i.x, ALTURA_TAMPO, i.z).addScaledVector(direita, i.raio).project(camera));
      const diam = Math.hypot(lado.x - c.x, lado.y - c.y) * 2;
      if (c.z > 1 || diam < DIAMETRO_MINIMO_NUMERO) {
        aplica(el, false, false);
        continue;
      }
      candidatos.push({ i, el, x: c.x, y: c.y, prof: c.z });
    }

    candidatos.sort((a, b) => prioridade(a.i) - prioridade(b.i) || a.prof - b.prof);
    const meio = LADO_NUMERO / 2;
    for (const c of candidatos) {
      const r = { x0: c.x - meio, y0: c.y - meio, x1: c.x + meio, y1: c.y + meio };
      const livre =
        r.x0 >= f.esquerda && r.y0 >= f.topo && r.x1 <= size.width - f.direita && r.y1 <= size.height - f.base && !grade.colide(r);
      aplica(c.el, livre, false);
      if (!livre) continue;
      grade.insere(r);
      c.el.style.zIndex = "1";
      c.el.style.transform = `translate3d(${c.x}px, ${c.y}px, 0)`;
    }

    // Marcos por último: somem quando colidem com mesa ou saem da área livre.
    listaMarcos.forEach((mc, k) => {
      const el = elsMarcos.current[k];
      if (!el) return;
      let t = tamMarcos.current.get(el);
      if (!t) tamMarcos.current.set(el, (t = { w: el.offsetWidth, h: el.offsetHeight, vis: -1 }));
      const p = tela(v.set(mc.x, mc.y, mc.z).project(camera));
      const x0 = p.x - t.w / 2;
      const y0 = p.y - t.h - 6;
      const r = { x0, y0, x1: x0 + t.w, y1: y0 + t.h };
      const cabe =
        p.z <= 1 && r.x0 >= f.esquerda && r.y0 >= f.topo && r.x1 <= size.width - f.direita && r.y1 <= size.height - f.base && !grade.colide(r);
      const vis = cabe ? (emFoco ? 0.35 : 1) : 0;
      if (cabe) {
        grade.insere(r);
        el.style.transform = `translate3d(${x0}px, ${y0}px, 0)`;
      }
      if (t.vis === vis) return;
      t.vis = vis;
      el.style.opacity = String(vis);
      el.style.transition = vis ? `${FADE}, visibility 0s` : `${FADE}, visibility 0s linear 150ms`;
      el.style.visibility = vis ? "visible" : "hidden";
    });
  });

  return null;
}
