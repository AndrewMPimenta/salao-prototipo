"use client";

import * as React from "react";
import type { EstadoMesa, Mesa } from "@/lib/types";
import { GLIFO_ESTADO, ROTULO_ESTADO, TRACO_ESTADO } from "@/lib/state";
import { posicoesCadeiras } from "@/lib/geometria";
import { cn, formatarDuracao } from "@/lib/utils";

export type Densidade = "minimo" | "padrao" | "completo";

interface TableShapeProps {
  mesa: Mesa;
  estado: EstadoMesa;
  densidade: Densidade;
  escala?: number;
  selecionada: boolean;
  atenuada: boolean;
  somenteLeitura?: boolean;
  onSelect?: (id: number) => void;
  tabIndex?: number;
}

export function TableShape({
  mesa,
  estado,
  densidade,
  escala = 1,
  selecionada,
  atenuada,
  somenteLeitura,
  onSelect,
  tabIndex = -1,
}: TableShapeProps) {
  const largura = mesa.largura * escala;
  const altura = mesa.altura * escala;
  const glifo = GLIFO_ESTADO[estado];
  const alerta = estado === "alerta1" || estado === "alerta2";

  const descricao = [
    `Mesa ${mesa.id}.`,
    ROTULO_ESTADO[estado],
    mesa.pessoas === 0 ? `${mesa.lugares} lugares` : `${mesa.pessoas} pessoas`,
    mesa.semPedido ? `${mesa.semPedido} minutos sem pedido` : null,
    mesa.abertaHa ? `aberta há ${formatarDuracao(mesa.abertaHa)}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  /*
    O número da mesa e o glifo ficam numa linha, o numeral grande embaixo.
    Antes os três empilhavam no centro e se sobrepunham em mesas pequenas.
  */
  const conteudo = (
    <>
      <span className="flex items-center gap-[3px] leading-none">
        <span className="text-[12px] font-semibold tracking-tight opacity-90">{mesa.id}</span>
        {densidade !== "minimo" && glifo && (
          <span aria-hidden className="text-[10px] font-bold leading-none -tracking-[0.08em]">
            {glifo}
          </span>
        )}
      </span>

      {densidade !== "minimo" && alerta && (
        <span className="tnum font-[family-name:var(--font-mono)] text-[15px] font-semibold leading-none">
          {mesa.semPedido}
        </span>
      )}
      {densidade !== "minimo" && !alerta && estado !== "livre" && (
        <span className="tnum font-[family-name:var(--font-mono)] text-[11px] font-medium leading-none opacity-80">
          {mesa.pessoas}
        </span>
      )}
      {densidade === "completo" && mesa.abertaHa && (
        <span className="tnum text-[9px] font-medium leading-none opacity-65">
          {formatarDuracao(mesa.abertaHa)}
        </span>
      )}
    </>
  );

  const estilo: React.CSSProperties = {
    left: `${mesa.x}%`,
    top: `${mesa.y}%`,
    width: largura,
    height: altura,
    background: `var(--color-${estado}-fill)`,
    borderColor: `var(--color-${estado}-stroke)`,
    borderWidth: TRACO_ESTADO[estado],
    borderStyle: estado === "livre" ? "dashed" : "solid",
    color: `var(--color-${estado}-ink)`,
    // Elevação é o que separa a mesa do piso. O preenchimento não dá conta.
    boxShadow: estado === "livre" ? "none" : "var(--shadow-table)",
    backgroundImage:
      estado === "conta"
        ? "repeating-linear-gradient(45deg, transparent 0 6px, color-mix(in srgb, var(--color-conta-stroke) 20%, transparent) 6px 12px)"
        : undefined,
  };

  const classes = cn(
    "absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-[2px]",
    "transition-[transform,opacity] duration-150 ease-out",
    mesa.forma === "redonda" ? "rounded-full" : "rounded-[7px]",
    atenuada && "opacity-20",
    selecionada && "z-20",
  );

  if (somenteLeitura) {
    return (
      <div role="img" aria-label={descricao} className={classes} style={estilo}>
        {conteudo}
      </div>
    );
  }

  return (
    <button
      type="button"
      tabIndex={tabIndex}
      data-mesa-id={mesa.id}
      aria-pressed={selecionada}
      aria-label={descricao}
      onClick={() => onSelect?.(mesa.id)}
      className={cn(
        classes,
        "cursor-pointer hover:z-10 hover:scale-[1.06]",
        selecionada && "scale-[1.06] ring-3 ring-(--color-focus) ring-offset-2 ring-offset-(--color-floor)",
        "focus-visible:z-20 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)",
      )}
      style={estilo}
    >
      {conteudo}
    </button>
  );
}

/**
 * As cadeiras ficam do lado de fora da mesa e contam pessoas — o carregador de
 * informação que não depende de cor nenhuma. Ficam deliberadamente discretas:
 * são contexto, não sinal.
 */
export function Cadeiras({ mesa, escala = 1 }: { mesa: Mesa; escala?: number }) {
  return (
    <div aria-hidden className="absolute h-0 w-0" style={{ left: `${mesa.x}%`, top: `${mesa.y}%` }}>
      {posicoesCadeiras(mesa).map((c, i) => (
        <span
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-[2px]"
          style={{
            left: c.x * escala,
            top: c.y * escala,
            width: c.largura * escala,
            height: c.altura * escala,
            background:
              i < mesa.pessoas
                ? "color-mix(in srgb, var(--color-ink) 45%, transparent)"
                : "color-mix(in srgb, var(--color-ink) 13%, transparent)",
          }}
        />
      ))}
    </div>
  );
}
