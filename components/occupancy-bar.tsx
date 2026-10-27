"use client";

import type { EstadoMesa } from "@/lib/types";
import { ORDEM_ESTADOS, ROTULO_ESTADO } from "@/lib/state";
import { cn } from "@/lib/utils";
import { AmostraEstado } from "./amostra-estado";

const ROTULO_FAIXA: Record<EstadoMesa, string> = {
  livre: "Livres",
  reservada: "Reservadas",
  ocupada: "Ocupadas",
  conta: "Conta",
};

interface OccupancyBarProps {
  contagem: Record<EstadoMesa, number>;
  total: number;
  filtro: EstadoMesa | null;
  onFiltrar: (estado: EstadoMesa | null) => void;
  /** Mesas com alerta: alerta não é estado, então ganha um chip à parte. */
  alertas: number;
  alertaAtivo: boolean;
  onAlertas: () => void;
  variante?: "faixa" | "flutuante" | "legenda";
}

/**
 * Duas peças com trabalhos separados: um medidor fino que carrega só a
 * proporção, e uma linha de chips que carrega número, rótulo e o filtro.
 * Com o texto dentro das faixas, 1 mesa em alerta contra 9 livres virava uma
 * lasca onde nem o numeral cabia — justo o estado mais importante.
 *
 * `flutuante` é a mesma composição compacta, para vidro sobre a cena 3D: sem
 * respiro externo (quem posiciona é o pai) e com rolagem horizontal, porque
 * cinco chips não cabem em 340px sem quebrar linha e cobrir a cena.
 */
export function OccupancyBar({
  contagem,
  total,
  filtro,
  onFiltrar,
  alertas,
  alertaAtivo,
  onAlertas,
  variante = "faixa",
}: OccupancyBarProps) {
  const flutuante = variante === "flutuante";

  /*
    Legenda: os mesmos filtros como linha que QUEBRA, sem medidor nem rolagem.
    Onde há largura fixa e pouca (painel de 380px), rolar escondia o último chip.
  */
  if (variante === "legenda") {
    return (
      <section aria-label="Filtrar por estado" className="flex flex-wrap gap-x-1 gap-y-0.5">
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
                "flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium pointer-coarse:min-h-11",
                "transition-[background-color,scale] duration-100 active:scale-[0.97]",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)",
                "disabled:cursor-default disabled:opacity-35",
                ativo ? "bg-(--color-accent) text-(--color-accent-ink)" : "text-(--color-ink-2) hover:bg-(--color-ink)/6",
              )}
            >
              <AmostraEstado estado={estado} className="size-3" />
              {ROTULO_FAIXA[estado]}
              <span className="tnum font-[family-name:var(--font-mono)]">{n}</span>
            </button>
          );
        })}
        <button
          type="button"
          disabled={alertas === 0}
          aria-pressed={alertaAtivo}
          aria-label={`Com alerta: ${alertas} de ${total} mesas.`}
          onClick={onAlertas}
          className={cn(
            "flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium pointer-coarse:min-h-11",
            "transition-[background-color,scale] duration-100 active:scale-[0.97]",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)",
            "disabled:cursor-default disabled:opacity-35",
            alertaAtivo ? "bg-(--color-accent) text-(--color-accent-ink)" : "text-(--color-ink-2) hover:bg-(--color-ink)/6",
          )}
        >
          <span aria-hidden className="size-2.5 flex-none rounded-full" style={{ background: "var(--color-alerta-critico)" }} />
          Com alerta
          <span className="tnum font-[family-name:var(--font-mono)]">{alertas}</span>
        </button>
      </section>
    );
  }

  return (
    <section
      className={cn(!flutuante && "px-6 pb-5 pt-4")}
      aria-label="Composição do salão"
    >
      {/*
        Borda real por segmento, não sombra interna. No tema claro o segmento
        `livre` é branco sobre superfície clara: sem a borda ele desaparecia,
        e o medidor parecia começar no meio.
      */}
      <div
        className={cn("flex gap-0.5", flutuante ? "h-1.5" : "h-2")}
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
                background: `var(--color-brilho-${estado})`,
              }}
              className={cn(
                "rounded-full transition-opacity duration-150",
                filtro && filtro !== estado && "opacity-25",
              )}
            />
          ) : null,
        )}
      </div>

      <div
        className={cn(
          "flex gap-1",
          flutuante
            ? "scrollbar-none -mx-1 mt-1 overflow-x-auto px-1"
            : "mt-3 flex-wrap",
        )}
      >
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
              /*
                Em `flutuante` o botão tem a altura de toque (44px) e o chip
                visível é o filho: a área clicável cresce sem engordar o vidro.
              */
              className={cn(
                "group flex flex-none items-center rounded-full",
                "transition-transform duration-100 active:scale-[0.97]",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)",
                "disabled:cursor-default disabled:opacity-35",
                "min-h-11",
              )}
            >
              <span
                className={cn(
                  "flex items-center gap-2 rounded-full transition-colors duration-150",
                  flutuante ? "h-8 pl-2 pr-3" : "h-10 pl-2.5 pr-4",
                  ativo
                    ? "bg-(--color-accent) text-(--color-accent-ink)"
                    : "text-(--color-ink) shadow-[inset_0_0_0_1px_var(--color-line)] group-hover:shadow-[inset_0_0_0_1px_var(--color-line-2)]",
                )}
              >
                <AmostraEstado estado={estado} className={flutuante ? "size-3.5" : "size-4"} />
                <span className="tnum font-[family-name:var(--font-mono)] text-sm font-semibold leading-none">
                  {n}
                </span>
                <span
                  className={cn(
                    "text-xs font-medium leading-none",
                    ativo ? "opacity-85" : "text-(--color-ink-2)",
                  )}
                >
                  {ROTULO_FAIXA[estado]}
                </span>
              </span>
            </button>
          );
        })}
        <button
          type="button"
          disabled={alertas === 0}
          aria-pressed={alertaAtivo}
          aria-label={`Com alerta: ${alertas} de ${total} mesas.`}
          onClick={onAlertas}
          className={cn(
            "group flex flex-none items-center rounded-full",
            "transition-transform duration-100 active:scale-[0.97]",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)",
            "disabled:cursor-default disabled:opacity-35",
            "min-h-11",
          )}
        >
          <span
            className={cn(
              "flex items-center gap-2 rounded-full transition-colors duration-150",
              flutuante ? "h-8 pl-2 pr-3" : "h-10 pl-2.5 pr-4",
              alertaAtivo
                ? "bg-(--color-accent) text-(--color-accent-ink)"
                : "text-(--color-ink) shadow-[inset_0_0_0_1px_var(--color-line)] group-hover:shadow-[inset_0_0_0_1px_var(--color-line-2)]",
            )}
          >
            <span
              aria-hidden
              className={cn("flex-none rounded-full", flutuante ? "size-3" : "size-4")}
              style={{ background: "var(--color-alerta-critico)" }}
            />
            <span className="tnum font-[family-name:var(--font-mono)] text-sm font-semibold leading-none">{alertas}</span>
            <span className={cn("text-xs font-medium leading-none", alertaAtivo ? "opacity-85" : "text-(--color-ink-2)")}>
              Com alerta
            </span>
          </span>
        </button>
      </div>
    </section>
  );
}
