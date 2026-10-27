"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { Alerta, EstadoMesa, Limiares, Mesa } from "@/lib/types";
import type { Salao } from "@/hooks/use-salao";
import type { ArmazemHover } from "@/hooks/use-hover-mesa";
import type { Exibicao } from "@/lib/exibicao";
import { FIXTURES, posicoesHabilitadas } from "@/lib/data";
import { derivarAlertas, derivarEstado } from "@/lib/state";
import { encaixar, GRADE_M, limitarAoCampo, mesasEmConflito, pegadaDe, sobrepoe } from "@/lib/layout";
import { MesaNoPlano, type Densidade } from "./table-shape";
import { BotaoIcone } from "./shell/botao-icone";
import { IconeLapis } from "./shell/icones";
import { useSpatialKeyboard } from "@/hooks/use-spatial-keyboard";
import { cn } from "@/lib/utils";
import { ms, obterCenario } from "./three/cenarios";

/** Menor mesa legível em px; abaixo disso a planta deixa de caber e passa a rolar. */
const MESA_MIN_PX = 12;
/** Respiro em metros em volta de campo e marcos, onde ficam cadeiras e glow. */
const MARGEM_M = 0.8;
/** Frequência natural da mola de assentamento: ~270 ms até parar, sem ultrapassar o alvo. */
const OMEGA = 24;
/** Deslocamento em px abaixo do qual o gesto é um toque, não um arrasto. */
const LIMIAR_ARRASTO = 3;

const SETAS: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

const SEM_CONFLITOS: ReadonlySet<number> = new Set();

interface FloorPlanProps {
  mesas: Mesa[];
  ambienteId: string;
  limiares: Limiares;
  densidade: Densidade;
  exibicao: Exibicao;
  filtro: EstadoMesa | null;
  /** Quando presente, tem precedência sobre `filtro` para esmaecer, como na cena 3D. */
  destacar?: (mesa: Mesa) => boolean;
  selecionada: number | null;
  hover: ArmazemHover;
  layout: Salao["layout"];
  posicaoSelecionada?: number | null;
  onSelecionarPosicao?: (numero: number) => void;
  somenteLeitura?: boolean;
  onSelect: (id: number) => void;
  onEscape: () => void;
}

interface Arrasto {
  id: number;
  el: HTMLElement;
  mesa: Mesa;
  pointerId: number;
  sx: number;
  sy: number;
  /** Centro da mesa ao pegar, em metros no campo. */
  ox: number;
  oy: number;
  livre: { x: number; y: number };
  alvo: { x: number; y: number };
  moveu: boolean;
}

/**
 * Mola criticamente amortecida de `de` até `para` (px): p(t) = para + (de − para)(1 + ωt)e^(−ωt).
 * O commit do layout vem no fim, com a mesa parada, porque renderizar 120 mesas no meio do gesto travaria a mola.
 * Devolve o "concluir agora", que pula o resto da mola e grava; com movimento reduzido assenta no ato.
 */
function assentar(el: HTMLElement, de: { x: number; y: number }, para: { x: number; y: number }, aoFim: (sincrono: boolean) => void): (sincrono?: boolean) => void {
  const dx = de.x - para.x;
  const dy = de.y - para.y;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || Math.hypot(dx, dy) < 0.5) {
    aoFim(true);
    return () => {};
  }

  let quadro = 0;
  let feito = false;
  const concluir = (sincrono = true) => {
    if (feito) return;
    feito = true;
    cancelAnimationFrame(quadro);
    aoFim(sincrono);
  };
  const t0 = performance.now();
  const passo = (agora: number) => {
    const t = (agora - t0) / 1000;
    const k = (1 + OMEGA * t) * Math.exp(-OMEGA * t);
    if (Math.hypot(dx * k, dy * k) < 0.3) {
      concluir();
      return;
    }
    el.style.transform = `translate3d(${para.x + dx * k}px, ${para.y + dy * k}px, 0)`;
    quadro = requestAnimationFrame(passo);
  };
  quadro = requestAnimationFrame(passo);
  return concluir;
}

export function FloorPlan({
  mesas,
  ambienteId,
  limiares,
  densidade,
  exibicao,
  filtro,
  destacar,
  selecionada,
  hover,
  layout,
  posicaoSelecionada = null,
  onSelecionarPosicao,
  somenteLeitura,
  onSelect,
  onEscape,
}: FloorPlanProps) {
  const { editando, setEditando, editado, mover, restaurar } = layout;
  useSpatialKeyboard({ mesas, ativo: !somenteLeitura && !editando, onEscape });

  const fixtures = FIXTURES[ambienteId] ?? [];
  let primeiraFocavel = true;

  const area = useRef<HTMLDivElement>(null);
  const [caixa, setCaixa] = useState({ w: 0, h: 0 });
  const [aviso, setAviso] = useState("");

  useLayoutEffect(() => {
    const el = area.current;
    if (!el) return;
    const medir = () => setCaixa({ w: el.clientWidth, h: el.clientHeight });
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // O mundo em metros é o campo de mesas do cenário 3D mais os marcos que sobram fora dele.
  const geo = useMemo(() => {
    const c = obterCenario(ambienteId);
    let x0 = 0;
    let y0 = 0;
    let x1 = c.campoL;
    let y1 = c.campoP;
    for (const f of fixtures) {
      x0 = Math.min(x0, (f.x / 100) * c.campoL);
      y0 = Math.min(y0, (f.y / 100) * c.campoP);
      x1 = Math.max(x1, ((f.x + f.largura) / 100) * c.campoL);
      y1 = Math.max(y1, ((f.y + f.altura) / 100) * c.campoP);
    }
    const menor = Math.min(...mesas.map((m) => Math.max(m.largura, m.altura)));
    return {
      campoL: c.campoL,
      campoP: c.campoP,
      x0: x0 - MARGEM_M,
      y0: y0 - MARGEM_M,
      mundoL: x1 - x0 + 2 * MARGEM_M,
      mundoP: y1 - y0 + 2 * MARGEM_M,
      menorMesaM: ms(menor),
    };
  }, [ambienteId, fixtures, mesas]);

  const pxPorM = useMemo(() => {
    if (caixa.w === 0 || caixa.h === 0) return 0;
    const cabe = Math.min(caixa.w / geo.mundoL, caixa.h / geo.mundoP);
    return Math.max(cabe, MESA_MIN_PX / geo.menorMesaM);
  }, [caixa, geo]);

  const escala = ms(1) * pxPorM;

  // Estado e alertas por mesa, com a mesma referência enquanto a mesa não muda: sem isso o memo das mesas não vale.
  const cache = useMemo(() => new WeakMap<Mesa, { estado: EstadoMesa; alertas: Alerta[] }>(), [limiares]);
  const situacao = (m: Mesa) => {
    let s = cache.get(m);
    if (!s) cache.set(m, (s = { estado: derivarEstado(m, limiares), alertas: derivarAlertas(m, limiares) }));
    return s;
  };

  const conflitos = useMemo(
    () => (editando ? mesasEmConflito(mesas, geo.campoL, geo.campoP) : SEM_CONFLITOS),
    [editando, mesas, geo.campoL, geo.campoP],
  );

  // Callbacks estáveis: o pai recria as funções a cada render e isso invalidaria o memo de todas as mesas.
  const ultimos = useRef({ onSelect, onSelecionarPosicao });
  ultimos.current = { onSelect, onSelecionarPosicao };
  const aoSelecionar = useCallback((id: number) => ultimos.current.onSelect(id), []);
  const aoPosicao = useCallback((n: number) => ultimos.current.onSelecionarPosicao?.(n), []);
  const posicoes = useMemo(() => ({ selecionada: posicaoSelecionada, onSelecionar: aoPosicao }), [posicaoSelecionada, aoPosicao]);

  const mostraPosicoes = exibicao.perfil === "completo" && exibicao.cadeiras && posicoesHabilitadas(ambienteId);

  // ---- Editor de layout ----
  const plano = useRef<HTMLDivElement>(null);
  const fantasma = useRef<HTMLDivElement>(null);
  const arrasto = useRef<Arrasto | null>(null);
  const cancelaMola = useRef(new Map<HTMLElement, (sincrono?: boolean) => void>());
  const vivo = useRef({ mesas, pxPorM, geo, mover });
  vivo.current = { mesas, pxPorM, geo, mover };

  // Esc conclui a edição antes de qualquer outro atalho tratá-lo (limpar seleção, sair do modo imersivo).
  useEffect(() => {
    if (!editando) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || arrasto.current) return;
      e.preventDefault();
      e.stopPropagation();
      setEditando(false);
    };
    window.addEventListener("keydown", esc, true);
    return () => window.removeEventListener("keydown", esc, true);
  }, [editando, setEditando]);

  useEffect(() => {
    const mola = cancelaMola.current;
    // Ao sair da planta no meio da mola, o movimento ainda é gravado, sem forçar render durante o descarte.
    return () => mola.forEach((c) => c(false));
  }, []);

  const aoPressionar = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!editando || e.button !== 0) return;
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-mesa-plano]");
    if (!el) return;
    const id = Number(el.dataset.mesaPlano);
    const mesa = vivo.current.mesas.find((m) => m.id === id);
    if (!mesa) return;

    cancelaMola.current.get(el)?.();
    el.style.transform = "";
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      // Ponteiro sintético ou já liberado: o arrasto segue pelos eventos que chegam ao plano.
    }

    const { campoL, campoP } = vivo.current.geo;
    const ox = (mesa.x / 100) * campoL;
    const oy = (mesa.y / 100) * campoP;
    arrasto.current = { id, el, mesa, pointerId: e.pointerId, sx: e.clientX, sy: e.clientY, ox, oy, livre: { x: ox, y: oy }, alvo: { x: ox, y: oy }, moveu: false };
  };

  const aoMover = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = arrasto.current;
    if (!d || e.pointerId !== d.pointerId) return;

    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (!d.moveu) {
      if (Math.hypot(dx, dy) < LIMIAR_ARRASTO) return;
      d.moveu = true;
      d.el.dataset.arrastando = "";
    }

    const { pxPorM: k, geo: g, mesas: todas } = vivo.current;
    // 1:1 com o ponteiro a partir de onde a mesa foi pega, contido no campo.
    d.livre = limitarAoCampo(d.ox + dx / k, d.oy + dy / k, d.mesa, g.campoL, g.campoP);
    d.alvo = e.altKey ? d.livre : limitarAoCampo(encaixar(d.livre.x), encaixar(d.livre.y), d.mesa, g.campoL, g.campoP);
    d.el.style.transform = `translate3d(${(d.livre.x - d.ox) * k}px, ${(d.livre.y - d.oy) * k}px, 0)`;

    const f = fantasma.current;
    if (f) {
      f.style.display = "block";
      f.style.left = `${d.alvo.x * k}px`;
      f.style.top = `${d.alvo.y * k}px`;
      f.style.width = `${ms(d.mesa.largura) * k}px`;
      f.style.height = `${ms(d.mesa.altura) * k}px`;
      f.style.borderRadius = d.mesa.forma === "redonda" ? "9999px" : "8px";
    }

    // A pegada considera onde a mesa vai assentar, não onde o ponteiro está.
    const alvo = pegadaDe({ ...d.mesa, x: (d.alvo.x / g.campoL) * 100, y: (d.alvo.y / g.campoP) * 100 }, g.campoL, g.campoP);
    const bate = todas.some((m) => m.id !== d.id && sobrepoe(alvo, pegadaDe(m, g.campoL, g.campoP)));
    if (bate) d.el.dataset.colide = "";
    else delete d.el.dataset.colide;
  };

  const aoSoltar = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = arrasto.current;
    if (!d || e.pointerId !== d.pointerId) return;
    arrasto.current = null;
    if (d.el.hasPointerCapture?.(e.pointerId)) d.el.releasePointerCapture(e.pointerId);
    if (fantasma.current) fantasma.current.style.display = "none";
    if (!d.moveu || e.type === "pointercancel") {
      delete d.el.dataset.arrastando;
      delete d.el.dataset.colide;
      d.el.style.transform = "";
      return;
    }

    const { pxPorM: k, geo: g } = vivo.current;
    const mudou = Math.abs(d.alvo.x - d.ox) > 1e-6 || Math.abs(d.alvo.y - d.oy) > 1e-6;
    const arred = (v: number) => Math.round(v * 1000) / 1000;

    // Desloca-se em px a partir da posição de origem; o fim da mola grava o layout e zera o transform no mesmo quadro.
    const de = { x: (d.livre.x - d.ox) * k, y: (d.livre.y - d.oy) * k };
    const para = mudou ? { x: (d.alvo.x - d.ox) * k, y: (d.alvo.y - d.oy) * k } : { x: 0, y: 0 };
    cancelaMola.current.set(
      d.el,
      assentar(d.el, de, para, (sincrono) => {
        const gravar = () => vivo.current.mover(d.id, arred((d.alvo.x / g.campoL) * 100), arred((d.alvo.y / g.campoP) * 100));
        if (mudou) sincrono ? flushSync(gravar) : gravar();
        d.el.style.transform = "";
        delete d.el.dataset.arrastando;
        delete d.el.dataset.colide;
        cancelaMola.current.delete(d.el);
      }),
    );
    if (mudou) setAviso(`Mesa ${d.id} movida para ${d.alvo.x.toFixed(2).replace(".", ",")} m, ${d.alvo.y.toFixed(2).replace(".", ",")} m.`);
  };

  const aoTeclar = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const seta = SETAS[e.key];
    if (!editando || !seta || e.ctrlKey || e.metaKey) return;
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-mesa-plano]");
    const mesa = el && vivo.current.mesas.find((m) => m.id === Number(el.dataset.mesaPlano));
    if (!mesa) return;
    e.preventDefault();

    const { campoL, campoP } = vivo.current.geo;
    const passo = e.shiftKey ? 1 : GRADE_M;
    const atual = { x: (mesa.x / 100) * campoL, y: (mesa.y / 100) * campoP };
    const proximo = (v: number, dir: number) => {
      const n = encaixar(v + dir * passo);
      return Math.abs(n - v) < 1e-6 ? v + dir * passo : n;
    };
    const novo = limitarAoCampo(proximo(atual.x, seta[0]), proximo(atual.y, seta[1]), mesa, campoL, campoP);
    if (Math.abs(novo.x - atual.x) < 1e-6 && Math.abs(novo.y - atual.y) < 1e-6) return;

    vivo.current.mover(mesa.id, Math.round((novo.x / campoL) * 100000) / 1000, Math.round((novo.y / campoP) * 100000) / 1000);
    setAviso(`Mesa ${mesa.id} movida para ${novo.x.toFixed(2).replace(".", ",")} m, ${novo.y.toFixed(2).replace(".", ",")} m.`);
  };

  const destaque = exibicao.destaque;

  // O aviso ocupa a faixa livre em volta do plano (lateral, depois topo) para não cobrir mesa; sem faixa, flutua no canto.
  const sobraX = (caixa.w - geo.mundoL * pxPorM) / 2;
  const sobraY = (caixa.h - geo.mundoP * pxPorM) / 2;
  const faixa: React.CSSProperties =
    sobraX >= 140 ? { width: sobraX - 8 } : sobraY >= 60 ? { right: 56 } : { maxWidth: 380 };

  return (
    <div className="relative h-full w-full">
      <div ref={area} className="flex h-full w-full overflow-auto">
        {pxPorM > 0 && (
          <div
            ref={plano}
            role="group"
            aria-label={
              editando
                ? "Planta em edição. Arraste as mesas ou use as setas para movê-las; Esc conclui."
                : "Planta do salão. As setas percorrem as mesas e Enter abre os detalhes."
            }
            onPointerDown={aoPressionar}
            onPointerMove={aoMover}
            onPointerUp={aoSoltar}
            onPointerCancel={aoSoltar}
            onKeyDown={aoTeclar}
            /*
              O piso é uma superfície lisa e rebaixada, sem grade: linhas de papel milimetrado
              competiriam com as mesas pela atenção. Só a edição mostra pontos a cada metro.
            */
            className={cn(
              "relative m-auto shrink-0 rounded-(--radius-panel) bg-(--color-floor)",
              "shadow-[inset_0_1px_3px_rgb(40_30_15/0.08),inset_0_0_0_1px_var(--color-line)]",
              editando && "select-none",
            )}
            style={{
              width: geo.mundoL * pxPorM,
              height: geo.mundoP * pxPorM,
              ...(editando && {
                backgroundImage: "radial-gradient(circle, color-mix(in srgb, var(--color-ink) 24%, transparent) 1px, transparent 1.6px)",
                backgroundSize: `${pxPorM}px ${pxPorM}px`,
                backgroundPosition: `${-geo.x0 * pxPorM - pxPorM / 2}px ${-geo.y0 * pxPorM - pxPorM / 2}px`,
              }),
            }}
          >
            <div
              className="absolute"
              style={{
                left: -geo.x0 * pxPorM,
                top: -geo.y0 * pxPorM,
                width: geo.campoL * pxPorM,
                height: geo.campoP * pxPorM,
              }}
            >
              {fixtures.map((f) => (
                <div
                  key={f.nome}
                  aria-hidden
                  className={cn(
                    "absolute flex items-center justify-center text-[10px] font-medium",
                    "uppercase tracking-[0.06em] text-(--color-ink-3)",
                    f.solido ? "rounded-[4px] bg-(--color-ink)/8" : "rounded-lg bg-(--color-ink)/4",
                  )}
                  style={{ left: `${f.x}%`, top: `${f.y}%`, width: `${f.largura}%`, height: `${f.altura}%` }}
                >
                  {f.nome}
                </div>
              ))}

              {/* Onde a mesa assenta ao soltar, já com o encaixe de 0,25 m. */}
              <div
                ref={fantasma}
                aria-hidden
                className="pointer-events-none absolute z-10 hidden -translate-x-1/2 -translate-y-1/2 border-[1.5px] border-dashed border-(--color-ink-2)"
              />

              {mesas.map((mesa) => {
                const { estado, alertas } = situacao(mesa);
                const esmaecida =
                  selecionada !== null ? mesa.id !== selecionada : destacar ? !destacar(mesa) : filtro !== null && filtro !== estado;
                const tabIndex = editando ? 0 : !somenteLeitura && primeiraFocavel ? 0 : -1;
                if (tabIndex === 0) primeiraFocavel = false;
                const fixada = selecionada === mesa.id;

                return (
                  <MesaNoPlano
                    key={mesa.id}
                    mesa={mesa}
                    estado={estado}
                    alertas={alertas}
                    densidade={densidade}
                    destaque={destaque}
                    escala={escala}
                    selecionada={fixada}
                    esmaecida={esmaecida}
                    conflito={conflitos.has(mesa.id)}
                    cadeiras={exibicao.cadeiras}
                    pessoas={exibicao.pessoas}
                    posicoes={fixada && mostraPosicoes && mesa.pessoas > 0 && mesa.posicoes ? posicoes : undefined}
                    somenteLeitura={somenteLeitura}
                    editando={editando}
                    hover={hover}
                    onSelect={aoSelecionar}
                    tabIndex={tabIndex}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {!somenteLeitura && (
        <div className="glass absolute right-0 top-0 z-30 rounded-full">
          <BotaoIcone rotulo={editando ? "Concluir edição do layout" : "Editar layout"} pressionado={editando} onClick={() => setEditando(!editando)}>
            <IconeLapis />
          </BotaoIcone>
        </div>
      )}

      {(editando || editado) && (
        <div
          style={faixa}
          className="glass absolute left-0 top-0 z-30 flex flex-col gap-0.5 rounded-[14px] px-3 py-2 text-[12px] leading-4 text-(--color-ink-2)"
        >
          {editando && (
            <p className="m-0">
              <span className="font-semibold text-(--color-ink)">Editar layout</span> · arraste as mesas · setas movem 0,25 m (Shift: 1 m) ·
              Alt desliga o encaixe · Esc conclui · <span className="text-(--color-ink-3)">Salvar no cadastro depende do Retaguarda.</span>
            </p>
          )}
          {editado && (
            <p className="m-0 flex flex-wrap items-center gap-x-1.5">
              <span className="font-medium text-(--color-ink)">Layout editado neste navegador</span>
              <span aria-hidden>·</span>
              <button
                type="button"
                onClick={restaurar}
                className="font-medium text-(--color-ink) underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)"
              >
                Restaurar layout original
              </button>
            </p>
          )}
        </div>
      )}

      <div role="status" aria-live="polite" className="sr-only">
        {aviso}
      </div>
    </div>
  );
}
