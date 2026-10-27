"use client";

import type { EstadoMesa } from "@/lib/types";
import { ORDEM_ESTADOS, ROTULO_ESTADO, TRACO_ESTADO } from "@/lib/state";
import { cn } from "@/lib/utils";

const ROTULO_FAIXA: Record<EstadoMesa, string> = {
  livre: "Livres",
  ocupada: "Ocupadas",
  alerta1: "20 min",
  alerta2: "40 min",
  conta: "Conta",
};

interface OccupancyBarProps {
  contagem: Record<EstadoMesa, number>;
  total: number;
  filtro: EstadoMesa | null;
  onFiltrar: (estado: EstadoMesa | null) => void;
}

/**
 * Antes isto era uma barra proporcional com o texto DENTRO de cada faixa. Com
 * 9 livres contra 1 em alerta, a faixa do alerta virava uma lasca de 12px que
 * não cabia nem o numeral — justo o estado mais importante ficava ilegível.
 *
 * Agora são duas peças: um medidor fino que carrega só a proporção, e uma
 * linha de chips que carrega número, rótulo e o filtro. Cada um faz um
 * trabalho, e o chip tem largura própria independente da contagem.
 */
export function OccupancyBar({ contagem, total, filtro, onFiltrar }: OccupancyBarProps) {
  return (
    <section className="px-7 pb-6 pt-5" aria-label="Composição do salão">
      {/*
        Borda real por segmento, não sombra interna. No tema claro o segmento
        `livre` é branco sobre superfície branca: sem a borda ele simplesmente
        desaparecia, e o medidor parecia começar no meio.
      */}
      <div
        className="flex h-3 gap-[3px]"
        role="img"
        aria-label={ORDEM_ESTADOS.filter((e) => contagem[e])
          .map((e) => `${contagem[e]} ${ROTULO_FAIXA[e]}`)
          .join(", ")}
      >
        {ORDEM_ESTADOS.map((estado) =>
          contagem[estado] ? (
            <span
              key={estado}
              style={{
                flex: `${contagem[estado]} 1 0`,
                background: `var(--color-${estado}-fill)`,
                border: `1.5px solid var(--color-${estado}-stroke)`,
              }}
              className={cn(
                "rounded-full transition-opacity",
                filtro && filtro !== estado && "opacity-25",
              )}
            />
          ) : null,
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {ORDEM_ESTADOS.map((estado) => {
          const n = contagem[estado] ?? 0;
          const ativo = filtro === estado;

          return (
            <button
              key={estado}
              type="button"
              disabled={n === 0}
              aria-pressed={ativo}
              aria-label={`${ROTULO_FAIXA[estado]}: ${n} de ${total} mesas. ${ROTULO_ESTADO[estado]}.`}
              onClick={() => onFiltrar(ativo ? null : estado)}
              className={cn(
                "group flex min-h-11 items-center gap-2.5 rounded-full py-1.5 pl-2 pr-4",
                "transition-colors duration-150",
                "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)",
                "disabled:cursor-default disabled:opacity-35",
                ativo
                  ? "bg-(--color-ink) text-(--color-app)"
                  : "bg-(--color-sunken)/70 hover:bg-(--color-sunken)",
              )}
            >
              <span
                aria-hidden
                style={{
                  background: `var(--color-${estado}-fill)`,
                  boxShadow: `inset 0 0 0 ${Math.min(TRACO_ESTADO[estado], 2.5)}px var(--color-${estado}-stroke)`,
                  backgroundImage:
                    estado === "conta"
                      ? "repeating-linear-gradient(45deg, transparent 0 3px, color-mix(in srgb, var(--color-conta-stroke) 30%, transparent) 3px 6px)"
                      : undefined,
                }}
                className="size-7 flex-none rounded-full"
              />
              <span className="tnum font-[family-name:var(--font-mono)] text-[17px] font-semibold leading-none">
                {n}
              </span>
              <span
                className={cn(
                  "text-[13px] font-medium leading-none",
                  ativo ? "opacity-90" : "text-(--color-ink-2)",
                )}
              >
                {ROTULO_FAIXA[estado]}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
