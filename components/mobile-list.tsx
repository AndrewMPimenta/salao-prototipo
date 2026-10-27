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
import { formatarDuracao } from "@/lib/utils";

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
    <ul className="flex flex-col gap-2 bg-(--color-app) px-3 pb-24 pt-3">
      <Secao titulo="Precisam de atenção" mesas={atencao} limiares={limiares} onSelect={onSelect} />
      <Secao
        titulo={filtro ? ROTULO_CURTO[filtro] : "Demais mesas"}
        mesas={resto}
        limiares={limiares}
        onSelect={onSelect}
      />
      {visiveis.length === 0 && (
        <li className="px-0.5 py-2 text-[11.5px] font-semibold text-(--color-ink-2)">
          Nenhuma mesa neste filtro.
        </li>
      )}
    </ul>
  );
}

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
      <li className="px-0.5 pb-0.5 pt-2 text-[11.5px] font-semibold text-(--color-ink-2)">
        {titulo}
      </li>
      {mesas.map((mesa) => {
        const estado = derivarEstado(mesa, limiares);
        const praca = PRACAS.find(
          (p) => p.id === mesa.pracaId && p.ambienteId === mesa.ambienteId,
        );
        const destaque = estado === "alerta1" || estado === "alerta2";

        return (
          <li key={mesa.id}>
            <button
              type="button"
              onClick={() => onSelect(mesa.id)}
              aria-label={`Mesa ${mesa.id}. ${ROTULO_ESTADO[estado]}`}
              className="flex min-h-15 w-full items-center gap-3 rounded-xl border border-(--color-line) bg-(--color-surface) px-3 py-2.5 text-left shadow-sm focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)"
            >
              <span
                aria-hidden
                className="grid size-10.5 flex-none place-items-center rounded-[10px] text-[15px] font-bold"
                style={{
                  background: `var(--color-${estado}-fill)`,
                  boxShadow: `inset 0 0 0 ${TRACO_ESTADO[estado]}px var(--color-${estado}-stroke)`,
                  color: `var(--color-${estado}-ink)`,
                }}
              >
                {mesa.id}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[14.5px] font-semibold tracking-tight">
                  Mesa {mesa.id}
                </span>
                <span className="mt-0.5 block text-xs text-(--color-ink-2)">
                  {ROTULO_CURTO[estado]}
                  {mesa.abertaHa ? ` · há ${formatarDuracao(mesa.abertaHa)}` : ` · ${mesa.lugares} lugares`}
                  {praca ? ` · ${praca.garcom}` : ""}
                </span>
              </span>

              <span className="tnum flex-none font-mono text-2xl font-semibold">
                {destaque ? (
                  <>
                    {mesa.semPedido}
                    <small className="ml-0.5 font-sans text-[10.5px] font-medium text-(--color-ink-3)">
                      min
                    </small>
                  </>
                ) : (
                  <span className="text-base">
                    {mesa.pessoas === 0 ? mesa.lugares : mesa.pessoas}
                    <small className="ml-0.5 font-sans text-[10.5px] font-medium text-(--color-ink-3)">
                      {mesa.pessoas === 0 ? "lug." : "pess."}
                    </small>
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
