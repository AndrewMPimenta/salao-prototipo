"use client";

import { useRef } from "react";
import { cadeirasNumeradas } from "@/lib/assentos";
import type { Mesa } from "@/lib/types";
import { cn } from "@/lib/utils";
import { IconeCheck } from "./icones";

/** Distância do tampo ao centro da cadeira e folga para o botão de 44 px não sair do quadro. */
const AFASTAMENTO = 26;
const FOLGA = 22;
/** Espaço mínimo entre cadeiras no lado da mesa retangular, para o alvo de toque de 44 px. */
const PASSO = 52;

interface DiagramaMesaProps {
  /** Mesa já com ocupação e pagamentos simulados aplicados. */
  mesa: Mesa;
  selecionada: number | null;
  editando: boolean;
  /** Posição com consumo (ou paga) não pode sair da mesa. */
  bloqueada: (numero: number) => boolean;
  rotulo: (numero: number) => string;
  onSelecionar: (numero: number) => void;
  onAlternarOcupacao: (numero: number) => void;
}

interface Assento {
  numero: number;
  cx: number;
  cy: number;
}

function montarLayout(mesa: Mesa) {
  const cadeiras = cadeirasNumeradas(mesa);

  if (mesa.forma === "redonda") {
    const raio = 28 + mesa.lugares * 6;
    const anel = raio + AFASTAMENTO;
    const lado = 2 * (anel + FOLGA);
    const assentos: Assento[] = cadeiras.map((c) => {
      const a = Math.atan2(c.y, c.x);
      return { numero: c.numero, cx: Math.cos(a) * anel, cy: Math.sin(a) * anel };
    });
    return { largura: lado, altura: lado, tampo: { largura: raio * 2, altura: raio * 2 }, assentos };
  }

  const vertical = mesa.altura > mesa.largura;
  const porLado = Math.ceil(mesa.lugares / 2);
  const comprimento = PASSO * (porLado + 1);
  const tampo = vertical ? { largura: 76, altura: comprimento } : { largura: comprimento, altura: 76 };
  const assentos: Assento[] = cadeiras.map((c) =>
    vertical
      ? { numero: c.numero, cx: Math.sign(c.x) * (tampo.largura / 2 + AFASTAMENTO), cy: (c.y / mesa.altura) * tampo.altura }
      : { numero: c.numero, cx: (c.x / mesa.largura) * tampo.largura, cy: Math.sign(c.y) * (tampo.altura / 2 + AFASTAMENTO) },
  );
  return {
    largura: tampo.largura + (vertical ? 2 * (AFASTAMENTO + FOLGA) : 2 * FOLGA),
    altura: tampo.altura + (vertical ? 2 * FOLGA : 2 * (AFASTAMENTO + FOLGA)),
    tampo,
    assentos,
  };
}

/** Vista de cima da mesa com as posições numeradas no sentido horário; cada cadeira é um botão. */
export function DiagramaMesa({ mesa, selecionada, editando, bloqueada, rotulo, onSelecionar, onAlternarOcupacao }: DiagramaMesaProps) {
  const layout = montarLayout(mesa);
  const botoes = useRef(new Map<number, HTMLButtonElement>());
  const estado = new Map((mesa.posicoes ?? []).map((p) => [p.numero, p]));

  const habilitada = (n: number) => editando || (estado.get(n)?.ocupada ?? false);
  const habilitadas = layout.assentos.map((a) => a.numero).filter(habilitada).sort((a, b) => a - b);
  const alvoDeTab = selecionada != null && habilitadas.includes(selecionada) ? selecionada : habilitadas[0];

  const mover = (de: number, passo: 1 | -1) => {
    const i = habilitadas.indexOf(de);
    const destino = habilitadas[(i + passo + habilitadas.length) % habilitadas.length];
    botoes.current.get(destino)?.focus();
  };

  return (
    <div
      role="group"
      aria-label={`Posições da mesa ${mesa.id}`}
      className="relative mx-auto max-w-full"
      style={{ width: layout.largura, aspectRatio: `${layout.largura} / ${layout.altura}` }}
      onKeyDown={(e) => {
        const n = Number((e.target as HTMLElement).dataset.posicao);
        if (!n) return;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          mover(n, 1);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          mover(n, -1);
        }
      }}
    >
      <svg aria-hidden viewBox={`0 0 ${layout.largura} ${layout.altura}`} className="absolute inset-0 size-full">
        {mesa.forma === "redonda" ? (
          <circle
            cx={layout.largura / 2}
            cy={layout.altura / 2}
            r={layout.tampo.largura / 2}
            fill="var(--color-ocupada-fill)"
            stroke="var(--color-ocupada-stroke)"
            strokeOpacity={0.5}
            strokeWidth={1.5}
          />
        ) : (
          <rect
            x={(layout.largura - layout.tampo.largura) / 2}
            y={(layout.altura - layout.tampo.altura) / 2}
            width={layout.tampo.largura}
            height={layout.tampo.altura}
            rx={14}
            fill="var(--color-ocupada-fill)"
            stroke="var(--color-ocupada-stroke)"
            strokeOpacity={0.5}
            strokeWidth={1.5}
          />
        )}
      </svg>

      <span
        aria-hidden
        className="font-display pointer-events-none absolute inset-0 grid place-items-center text-[32px] text-(--color-ink)/45"
      >
        {mesa.id}
      </span>

      {layout.assentos.map(({ numero, cx, cy }) => {
        const p = estado.get(numero);
        const ocupada = p?.ocupada ?? false;
        const paga = p?.paga ?? false;
        const ativa = selecionada === numero;
        const travada = editando && ocupada && bloqueada(numero);

        return (
          <button
            key={numero}
            ref={(el) => {
              if (el) botoes.current.set(numero, el);
              else botoes.current.delete(numero);
            }}
            type="button"
            data-posicao={numero}
            aria-label={rotulo(numero)}
            aria-pressed={editando ? undefined : ativa}
            aria-disabled={!habilitada(numero) || travada || undefined}
            disabled={!habilitada(numero)}
            tabIndex={numero === alvoDeTab ? 0 : -1}
            onClick={() => {
              if (travada) return;
              if (editando) onAlternarOcupacao(numero);
              else onSelecionar(numero);
            }}
            className={cn(
              "group absolute grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full",
              "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-(--color-focus)",
              "disabled:cursor-default",
            )}
            style={{ left: `${((layout.largura / 2 + cx) / layout.largura) * 100}%`, top: `${((layout.altura / 2 + cy) / layout.altura) * 100}%` }}
          >
            <span
              className={cn(
                "tnum grid size-9 place-items-center rounded-full text-[12px] font-semibold leading-none",
                "transition-[background-color,color,transform,box-shadow] duration-150 group-active:scale-[0.94]",
                paga && "bg-(--color-sunken) text-(--color-ink-3) shadow-[inset_0_0_0_1px_var(--color-line-2)]",
                !paga && ativa && "bg-(--color-accent) text-(--color-accent-ink) shadow-[0_1px_3px_rgb(40_30_15/0.3)]",
                !paga && !ativa && ocupada && "bg-(--color-raised) text-(--color-ink) shadow-[inset_0_0_0_1.5px_var(--color-ink-2)]",
                !ocupada && "border border-dashed border-(--color-line-2) text-(--color-ink-3)",
                travada && "opacity-50",
              )}
            >
              {paga ? <IconeCheck className="size-4" /> : `P${numero}`}
            </span>
          </button>
        );
      })}
    </div>
  );
}
