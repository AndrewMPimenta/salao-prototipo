"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { EstadoMesa, Mesa } from "@/lib/types";
import { GLIFO_ESTADO, ROTULO_CURTO } from "@/lib/state";
import { cn } from "@/lib/utils";
import { ALTURA_ROTULO_3D, ALTURA_TAMPO } from "./cenarios";
import type { Par } from "./materiais";

export interface ItemRotulo {
  mesa: Mesa;
  estado: EstadoMesa;
  par: Par;
  x: number;
  z: number;
  selecionada: boolean;
  colidindo: boolean;
}

const ESTADOS_ALERTA = new Set<EstadoMesa>(["alerta1", "alerta2", "conta"]);

/**
 * Pino de 26px com o número. Livre é tinta cheia (luminância máxima, sem matiz
 * nova); ocupada recua em superfície com texto secundário; alertas ganham uma
 * etiqueta colada à direita. Selecionada expande com lugares e situação.
 */
function Pino({ i }: { i: ItemRotulo }) {
  const { mesa, estado, selecionada, colidindo } = i;
  const glifo = GLIFO_ESTADO[estado];
  const alerta = ESTADOS_ALERTA.has(estado);
  const minutos = estado === "alerta1" || estado === "alerta2" ? `${mesa.semPedido}′` : null;

  if (selecionada) {
    return (
      <div
        className="flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-full border-[1.5px] border-(--color-ink) bg-(--color-surface) px-3.5 py-1 text-[15px] font-semibold text-(--color-ink) shadow-[0_4px_14px_rgba(0,0,0,0.3)]"
        style={{ transform: "translate(-50%, -50%)" }}
      >
        <span className="tnum">Mesa {mesa.id}</span>
        <span className="font-medium text-(--color-ink-2)">
          · {mesa.lugares} lugares · {ROTULO_CURTO[estado]}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn("flex items-center transition-opacity duration-150", colidindo && "opacity-30")}
      style={{ transform: "translate(-13px, -50%)" }}
    >
      <span
        className={cn(
          "tnum z-10 grid size-[26px] flex-none place-items-center rounded-full border text-[13px] font-bold shadow-[0_1px_5px_rgba(0,0,0,0.22)]",
          estado === "livre"
            ? "border-(--color-ink) bg-(--color-ink) text-(--color-surface)"
            : "border-(--color-line-2) bg-(--color-surface) text-(--color-ink)",
          estado === "ocupada" && "text-(--color-ink-2) opacity-85",
        )}
      >
        {mesa.id}
      </span>
      {alerta && (
        <span
          className="-ml-2 flex h-5 items-center gap-1 rounded-r-full border pr-2 pl-3 text-[11px] font-bold whitespace-nowrap"
          style={{
            background: `var(--color-${estado}-fill)`,
            color: `var(--color-${estado}-ink)`,
            borderColor: `var(--color-${estado}-stroke)`,
          }}
        >
          {glifo}
          {minutos && <span className="tnum">{minutos}</span>}
        </span>
      )}
    </div>
  );
}

export type MapaRotulos = Map<number, HTMLDivElement>;

/*
  Os rótulos são DOM comum sobre o canvas, posicionados por projeção só quando
  a câmera muda. O <Html> do drei criava uma raiz React por rótulo, e o
  desmonte dessas raízes durante a renderização quebrava o StrictMode.

  Cada rótulo flutua acima da mesa, ligado ao tampo por um fio de 1px, para a
  mesa continuar visível embaixo.
*/
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
          style={{ visibility: "hidden", zIndex: i.selecionada ? 2 : 1 }}
        >
          <div
            className="absolute top-0 left-0 w-px"
            style={{ background: corHaste, opacity: i.colidindo && !i.selecionada ? 0.12 : 0.45 }}
          />
          <Pino i={i} />
        </div>
      ))}
    </div>
  );
}

/** Roda dentro do Canvas, onde a câmera está, e escreve a posição de cada rótulo direto no DOM. */
export function ProjetorRotulos({ itens, els }: { itens: ItemRotulo[]; els: React.RefObject<MapaRotulos> }) {
  const { camera, size, invalidate } = useThree();
  const atual = useRef(itens);
  atual.current = itens;
  const ultimo = useRef<{ m: number[]; w: number; h: number } | null>(null);

  // Mudou a lista (filtro, seleção): os elementos são novos, então a posição em cache não vale.
  useEffect(() => {
    ultimo.current = null;
    invalidate();
  }, [itens, invalidate]);

  useFrame(() => {
    camera.updateMatrixWorld();
    const m = [...camera.matrixWorld.elements, (camera as THREE.PerspectiveCamera).projectionMatrix.elements[5]];
    const u = ultimo.current;
    if (u && u.w === size.width && u.h === size.height && u.m.every((v, k) => v === m[k])) return;
    ultimo.current = { m, w: size.width, h: size.height };

    const topo = new THREE.Vector3();
    const base = new THREE.Vector3();

    for (const i of atual.current) {
      const el = els.current.get(i.mesa.id);
      if (!el) continue;

      topo.set(i.x, ALTURA_ROTULO_3D, i.z).project(camera);
      base.set(i.x, ALTURA_TAMPO + 0.03, i.z).project(camera);
      if (topo.z > 1) {
        el.style.visibility = "hidden";
        continue;
      }

      const x = (topo.x * 0.5 + 0.5) * size.width;
      const y = (-topo.y * 0.5 + 0.5) * size.height;
      const yBase = (-base.y * 0.5 + 0.5) * size.height;

      el.style.visibility = "visible";
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      (el.firstElementChild as HTMLElement).style.height = `${Math.max(0, yBase - y)}px`;
    }
  });

  return null;
}

/*
  MEDE COLISÃO DE RÓTULO, e não oclusão: os tampos são discos finos a 74 cm e
  a câmera nunca desce abaixo deles, então oclusão de tampo é desprezível. O
  que degrada ao inclinar a câmera é o rótulo, porque as mesas do fundo se
  aproximam na tela e os rótulos se empilham.

  A projeção é por ponto de âncora, aproximando cada rótulo por uma caixa
  fixa. É estimativa, não medição de DOM.
*/
const LARGURA_ROTULO = 46;
const ALTURA_ROTULO = 28;

export function MedidorDeRotulos({
  pontos,
  ativo,
  onChange,
}: {
  pontos: { id: number; x: number; y: number; z: number }[];
  ativo: boolean;
  onChange: (s: Set<number>) => void;
}) {
  const { camera, size } = useThree();
  const anterior = useRef("");
  const quadro = useRef(0);

  useFrame(() => {
    if (!ativo || quadro.current++ % 6 !== 0) return;

    const v = new THREE.Vector3();
    const tela: { id: number; x: number; y: number }[] = [];

    for (const p of pontos) {
      v.set(p.x, p.y, p.z).project(camera);
      if (v.z > 1) continue;
      tela.push({ id: p.id, x: (v.x * 0.5 + 0.5) * size.width, y: (-v.y * 0.5 + 0.5) * size.height });
    }

    const colidindo = new Set<number>();
    for (let i = 0; i < tela.length; i++) {
      for (let j = i + 1; j < tela.length; j++) {
        const a = tela[i];
        const b = tela[j];
        if (Math.abs(a.x - b.x) < LARGURA_ROTULO && Math.abs(a.y - b.y) < ALTURA_ROTULO) {
          colidindo.add(a.id);
          colidindo.add(b.id);
        }
      }
    }

    const chave = [...colidindo].sort((a, b) => a - b).join(",");
    if (chave !== anterior.current) {
      anterior.current = chave;
      onChange(colidindo);
    }
  });

  return null;
}
