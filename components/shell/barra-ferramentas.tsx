"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Salao } from "@/hooks/use-salao";
import { useMedida } from "@/hooks/use-medida";
import type { Lado } from "@/hooks/use-ancoragem";
import {
  ANCORAS,
  ANCORAS_DISPOSITIVO,
  configPadrao,
  useBarraFerramentas,
  type Ancora,
  type Dispositivo,
  type IdAncora,
} from "@/hooks/use-barra-ferramentas";
import { Ferramenta } from "./camera-controles";
import { EditorBarra } from "./editor-barra";
import { IconeAlca } from "./icones";
import { materializar } from "./materializar";
import type { PropsExibicao } from "./menu-exibicao";

export interface Retangulo {
  esq: number;
  topo: number;
  dir: number;
  base: number;
}

interface BarraFerramentasProps {
  camera: Salao["camera"];
  exibicao: PropsExibicao;
  dispositivo: Dispositivo;
  aberto: boolean;
  /** Área onde a barra pode pousar, em px da janela; fora dela ficam a barra do topo, o painel lateral e a gaveta. */
  area: Retangulo;
  /** Painel que a barra nunca cobre quando pousa perto dele. */
  evitar?: Retangulo | null;
}

// Tempo de resposta da mola (s): amortecimento crítico, sem quique.
const RESPOSTA = 0.4;
const MARGEM_JANELA = 8;

const reduzido = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Distância que o gesto ainda percorreria sozinho: a projeção de desaceleração da Apple. */
const projetar = (v: number) => ((v / 1000) * 0.998) / (1 - 0.998);

/** Além do limite o arrasto rende cada vez menos, até uma fração da dimensão. */
const elastico = (d: number, dim: number) => (1 - 1 / ((d * 0.55) / dim + 1)) * dim;

function posicaoDe(a: Ancora, t: { w: number; h: number }, area: Retangulo, evitar?: Retangulo | null) {
  const x = a.col === 0 ? area.esq : a.col === 1 ? (area.esq + area.dir - t.w) / 2 : area.dir - t.w;
  let y = a.linha === 0 ? area.topo : a.linha === 1 ? (area.topo + area.base - t.h) / 2 : area.base - t.h;
  const pos = { x: Math.max(area.esq, x), y: Math.max(area.topo, y) };

  if (evitar && pos.x < evitar.dir && pos.x + t.w > evitar.esq && pos.y + t.h > evitar.topo && pos.y < evitar.base) {
    y = evitar.topo - 8 - t.h;
    pos.y = Math.max(area.topo, y);
  }
  return pos;
}

const DIRECOES: Record<string, { x: number; y: number }> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
};

/** A zona mais próxima na direção da seta, preferindo a que fica na mesma linha ou coluna. */
function vizinha(atual: IdAncora, dir: { x: number; y: number }, lista: IdAncora[]) {
  const a = ANCORAS[atual];
  let melhor: IdAncora | null = null;
  let nota = Infinity;
  for (const id of lista) {
    const c = ANCORAS[id];
    const dx = c.col - a.col;
    const dy = c.linha - a.linha;
    const ao = dx * dir.x + dy * dir.y;
    if (ao <= 0) continue;
    const n = ao + Math.abs(dx * dir.y - dy * dir.x) * 2;
    if (n < nota) {
      nota = n;
      melhor = id;
    }
  }
  return melhor;
}

interface Movimento {
  t0: number;
  de: { x: number; y: number };
  para: { x: number; y: number };
  v: { x: number; y: number };
}

interface Arrasto {
  dx: number;
  dy: number;
  ox: number;
  oy: number;
  amostras: { t: number; x: number; y: number }[];
}

/**
 * Barra de ferramentas da câmera que o usuário posiciona: a alça arrasta 1:1,
 * e ao soltar a barra carrega o embalo até a zona de ancoragem mais próxima
 * (oito zonas: centros das bordas e cantos), numa mola de amortecimento crítico.
 */
export function BarraFerramentas({ camera, exibicao, dispositivo, aberto, area, evitar }: BarraFerramentasProps) {
  const { config, atualizar, restaurar } = useBarraFerramentas(dispositivo);
  const [medir, tam] = useMedida();
  const [pronto, setPronto] = useState(false);
  const [arrastando, setArrastando] = useState(false);

  const raiz = useRef<HTMLDivElement | null>(null);
  const pos = useRef({ x: 0, y: 0 });
  const destino = useRef({ x: NaN, y: NaN });
  const movimento = useRef<Movimento | null>(null);
  const quadro = useRef(0);
  const arrasto = useRef<Arrasto | null>(null);

  const refBarra = useCallback(
    (el: HTMLDivElement | null) => {
      raiz.current = el;
      medir(el);
    },
    [medir],
  );

  const horizontal = config.orientacao === "horizontal";
  const disponiveis = ANCORAS_DISPOSITIVO[dispositivo];
  const { esq, topo, dir, base } = area;
  const ev = evitar;
  const alvoDe = useCallback(
    (id: IdAncora) =>
      posicaoDe(ANCORAS[id], tam, { esq, topo, dir, base }, ev ? { esq: ev.esq, topo: ev.topo, dir: ev.dir, base: ev.base } : null),
    // `ev` entra pelos números: o objeto muda de identidade a cada render do layout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tam.w, tam.h, esq, topo, dir, base, ev?.esq, ev?.topo, ev?.dir, ev?.base],
  );

  const escrever = useCallback((x: number, y: number) => {
    pos.current = { x, y };
    if (raiz.current) raiz.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }, []);

  const parar = useCallback(() => {
    cancelAnimationFrame(quadro.current);
    movimento.current = null;
  }, []);

  const mola = useCallback(
    (para: { x: number; y: number }, v = { x: 0, y: 0 }) => {
      parar();
      destino.current = para;
      if (reduzido()) {
        escrever(para.x, para.y);
        return;
      }

      movimento.current = { t0: performance.now(), de: { ...pos.current }, para, v };
      const w = (2 * Math.PI) / RESPOSTA;
      const eixo = (de: number, alvo: number, v0: number, t: number) => {
        const a = de - alvo;
        const b = v0 + w * a;
        const e = Math.exp(-w * t);
        return { p: alvo + (a + b * t) * e, v: (b - w * (a + b * t)) * e };
      };

      const passo = (agora: number) => {
        const m = movimento.current;
        if (!m) return;
        const t = (agora - m.t0) / 1000;
        const X = eixo(m.de.x, m.para.x, m.v.x, t);
        const Y = eixo(m.de.y, m.para.y, m.v.y, t);
        const quieto = Math.abs(X.p - m.para.x) < 0.3 && Math.abs(Y.p - m.para.y) < 0.3 && Math.abs(X.v) < 8 && Math.abs(Y.v) < 8;
        if (t > 0.1 && quieto) {
          escrever(m.para.x, m.para.y);
          movimento.current = null;
          return;
        }
        escrever(X.p, Y.p);
        quadro.current = requestAnimationFrame(passo);
      };
      quadro.current = requestAnimationFrame(passo);
    },
    [escrever, parar],
  );

  // Primeiro pouso sem animação; depois, qualquer mudança de alvo (janela, painel, orientação) vira mola.
  useLayoutEffect(() => {
    if (tam.w === 0 || arrasto.current) return;
    const alvo = alvoDe(config.ancora);
    if (!pronto) {
      escrever(alvo.x, alvo.y);
      destino.current = alvo;
      setPronto(true);
    } else if (Math.abs(alvo.x - destino.current.x) > 0.5 || Math.abs(alvo.y - destino.current.y) > 0.5) {
      mola(alvo);
    }
  }, [alvoDe, config.ancora, tam.w, pronto, escrever, mola]);

  useEffect(() => parar, [parar]);

  const pressionar = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ponteiro já encerrado: o arrasto segue pelos eventos do próprio alvo.
    }
    parar();
    const o = raiz.current?.offsetParent?.getBoundingClientRect();
    const ox = o?.left ?? 0;
    const oy = o?.top ?? 0;
    arrasto.current = {
      dx: e.clientX - ox - pos.current.x,
      dy: e.clientY - oy - pos.current.y,
      ox,
      oy,
      amostras: [{ t: e.timeStamp, x: pos.current.x, y: pos.current.y }],
    };
    setArrastando(true);
  };

  const mover = (e: React.PointerEvent<HTMLButtonElement>) => {
    const a = arrasto.current;
    const pai = raiz.current?.offsetParent as HTMLElement | null;
    if (!a || !pai) return;

    let x = e.clientX - a.ox - a.dx;
    let y = e.clientY - a.oy - a.dy;
    const maxX = pai.clientWidth - tam.w - MARGEM_JANELA;
    const maxY = pai.clientHeight - tam.h - MARGEM_JANELA;
    if (x < MARGEM_JANELA) x = MARGEM_JANELA - elastico(MARGEM_JANELA - x, pai.clientWidth);
    else if (x > maxX) x = maxX + elastico(x - maxX, pai.clientWidth);
    if (y < MARGEM_JANELA) y = MARGEM_JANELA - elastico(MARGEM_JANELA - y, pai.clientHeight);
    else if (y > maxY) y = maxY + elastico(y - maxY, pai.clientHeight);

    escrever(x, y);
    a.amostras.push({ t: e.timeStamp, x, y });
    if (a.amostras.length > 12) a.amostras.shift();
  };

  const soltar = (e: React.PointerEvent<HTMLButtonElement>) => {
    const a = arrasto.current;
    if (!a) return;
    arrasto.current = null;
    setArrastando(false);

    // Velocidade da última janela de 100 ms; um gesto parado antes de soltar não carrega embalo.
    const ultima = a.amostras[a.amostras.length - 1];
    const ref = a.amostras.find((s) => ultima.t - s.t <= 100) ?? ultima;
    const dt = (ultima.t - ref.t) / 1000;
    const parado = e.timeStamp - ultima.t > 80;
    const v = dt > 0.008 && !parado ? { x: (ultima.x - ref.x) / dt, y: (ultima.y - ref.y) / dt } : { x: 0, y: 0 };
    const solta = reduzido() ? { x: pos.current.x, y: pos.current.y } : { x: pos.current.x + projetar(v.x), y: pos.current.y + projetar(v.y) };

    let id = config.ancora;
    let menor = Infinity;
    for (const cand of disponiveis) {
      const p = alvoDe(cand);
      const d = Math.hypot(p.x - solta.x, p.y - solta.y);
      if (d < menor) {
        menor = d;
        id = cand;
      }
    }

    mola(alvoDe(id), v);
    if (id !== config.ancora) atualizar({ ancora: id });
  };

  const teclar = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const d = DIRECOES[e.key];
    if (!d) return;
    e.preventDefault();
    const prox = vizinha(config.ancora, d, disponiveis);
    if (prox) atualizar({ ancora: prox });
  };

  const a = ANCORAS[config.ancora];
  // Os popovers abrem para o lado que a barra deixa livre.
  const lado: Lado = horizontal ? (a.linha === 0 ? "baixo" : "cima") : a.col === 2 ? "esquerda" : "direita";
  const visiveis = config.ordem.filter((id) => !config.ocultas.includes(id));
  const padrao = configPadrao(dispositivo);
  const personalizada = JSON.stringify(config) !== JSON.stringify(padrao);

  return (
    <div
      ref={refBarra}
      role="toolbar"
      aria-label="Ferramentas da câmera"
      aria-orientation={config.orientacao}
      inert={!aberto}
      data-arrastando={arrastando}
      className={cn(
        "glass absolute top-0 left-0 z-20 flex rounded-[22px] p-1 will-change-transform data-[arrastando=true]:scale-[1.03]",
        horizontal ? "flex-row items-center" : "flex-col items-center",
        materializar(aberto && pronto),
      )}
    >
      <button
        type="button"
        aria-label="Mover barra de ferramentas"
        aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"
        title="Mover barra de ferramentas"
        onPointerDown={pressionar}
        onPointerMove={mover}
        onPointerUp={soltar}
        onPointerCancel={soltar}
        onKeyDown={teclar}
        className={cn(
          "grid flex-none touch-none cursor-grab place-items-center rounded-full text-(--color-ink-3) active:cursor-grabbing",
          "hover:bg-(--color-ink)/8 hover:text-(--color-ink-2) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)",
          horizontal ? "h-11 w-7" : "h-7 w-11",
        )}
      >
        <IconeAlca deitada={!horizontal} />
      </button>

      {visiveis.map((id) => (
        <Ferramenta
          key={id}
          id={id}
          camera={camera}
          exibicao={exibicao}
          orientacao={config.orientacao}
          lado={lado}
          movel={dispositivo === "movel"}
        />
      ))}

      <EditorBarra config={config} lado={lado} personalizada={personalizada} onConfig={atualizar} onRestaurar={restaurar} />
    </div>
  );
}
