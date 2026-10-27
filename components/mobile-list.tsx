"use client";

import type { EstadoMesa, Limiares, Mesa } from "@/lib/types";
import { PRACAS } from "@/lib/data";
import {
  derivarEstado,
  pesoTriagem,
  precisaAtencao,
  ROTULO_CURTO,
  ROTULO_ESTADO,
  TRACO_ESTADO,
} from "@/lib/state";
import { cn, formatarDuracao } from "@/lib/utils";

interface MobileListProps {
  mesas: Mesa[];
  limiares: Limiares;
  filtro: EstadoMesa | null;
  onSelect: (id: number) => void;
}

/**
 * No celular a planta não sobrevive: em 390px cabem ~6 mesas com alvos
 * conformes (44–48px), e um salão de 20+ não cabe. O ambiente vira o alvo
 * grande e a mesa vira lista — ordenada por POSIÇÃO FÍSICA, não alfabética,
 * com as de atenção ancoradas no topo.
 */
export function MobileList({ mesas, limiares, filtro, onSelect }: MobileListProps) {
  const visiveis = filtro
    ? mesas.filter((m) => derivarEstado(m, limiares) === filtro)
    : mesas;

  const atencao = visiveis
    .filter((m) => precisaAtencao(derivarEstado(m, limiares)))
    .sort(
      (a, b) =>
        pesoTriagem(derivarEstado(b, limiares), b.semPedido) -
        pesoTriagem(derivarEstado(a, limiares), a.semPedido),
    );

  const resto = visiveis
    .filter((m) => !precisaAtencao(derivarEstado(m, limiares)))
    .sort((a, b) => a.y - b.y || a.x - b.x);

  return (
    <ul className="m-0 flex list-none flex-col px-4 pb-24 pt-1">
      <Secao titulo="Precisam de atenção" mesas={atencao} limiares={limiares} onSelect={onSelect} />
      <Secao
        titulo={filtro ? ROTULO_CURTO[filtro] : "Demais mesas"}
        mesas={resto}
        limiares={limiares}
        onSelect={onSelect}
      />
      {visiveis.length === 0 && (
        <li className="py-4 text-sm text-(--color-ink-2)">Nenhuma mesa neste filtro.</li>
      )}
    </ul>
  );
}

/*
  Sem fundo nem cartão por linha: a lista vive dentro de uma gaveta que já é
  a superfície. Divisórias finas separam as linhas; o respiro entre seções
  vem do cabeçalho, não de caixas.
*/
function Secao({
  titulo,
  mesas,
  limiares,
  onSelect,
}: {
  titulo: string;
  mesas: Mesa[];
  limiares: Limiares;
  onSelect: (id: number) => void;
}) {
  if (mesas.length === 0) return null;

  return (
    <>
      <li className="pb-1 pt-5 text-[11px] font-semibold uppercase tracking-[0.06em] text-(--color-ink-3)">
        {titulo}
      </li>
      {mesas.map((mesa, i) => {
        const estado = derivarEstado(mesa, limiares);
        const praca = PRACAS.find(
          (p) => p.id === mesa.pracaId && p.ambienteId === mesa.ambienteId,
        );
        const destaque = estado === "alerta1" || estado === "alerta2";

        return (
          <li key={mesa.id} className={cn(i > 0 && "border-t border-(--color-line)")}>
            <button
              type="button"
              onClick={() => onSelect(mesa.id)}
              aria-label={`Mesa ${mesa.id}. ${ROTULO_ESTADO[estado]}`}
              className={cn(
                "-mx-2 flex min-h-14 w-[calc(100%+1rem)] items-center gap-3 rounded-(--radius-control) px-2 py-2 text-left",
                "transition-[background-color,transform] duration-100 active:scale-[0.98] active:bg-(--color-ink)/5",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)",
              )}
            >
              <span
                aria-hidden
                className="grid size-10 flex-none place-items-center rounded-[10px] text-base font-semibold"
                style={{
                  background: `var(--color-${estado}-fill)`,
                  boxShadow: `inset 0 0 0 ${TRACO_ESTADO[estado]}px var(--color-${estado}-stroke)`,
                  color: `var(--color-${estado}-ink)`,
                }}
              >
                {mesa.id}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold leading-5">Mesa {mesa.id}</span>
                <span className="mt-0.5 block truncate text-xs leading-4 text-(--color-ink-2)">
                  {ROTULO_CURTO[estado]}
                  {praca ? ` · ${praca.garcom}` : ""}
                </span>
              </span>

              <span className="tnum flex-none text-right font-[family-name:var(--font-mono)] font-semibold">
                {destaque ? (
                  <span className="text-[17px]">
                    {mesa.semPedido}
                    <small className="ml-0.5 font-sans text-[11px] font-medium text-(--color-ink-3)">
                      min
                    </small>
                  </span>
                ) : (
                  <span className="text-[15px] text-(--color-ink-2)">
                    {mesa.abertaHa
                      ? formatarDuracao(mesa.abertaHa)
                      : mesa.pessoas === 0
                        ? mesa.lugares
                        : mesa.pessoas}
                    {!mesa.abertaHa && (
                      <small className="ml-0.5 font-sans text-[11px] font-medium text-(--color-ink-3)">
                        {mesa.pessoas === 0 ? "lug." : "pess."}
                      </small>
                    )}
                  </span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </>
  );
}
