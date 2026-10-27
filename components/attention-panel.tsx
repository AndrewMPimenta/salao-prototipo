"use client";

import type { Limiares, Mesa } from "@/lib/types";
import { PRACAS } from "@/lib/data";
import { derivarEstado, precisaAtencao, ROTULO_CURTO, TRACO_ESTADO } from "@/lib/state";
import { formatarDuracao } from "@/lib/utils";

interface AttentionPanelProps {
  mesas: Mesa[];
  limiares: Limiares;
  onSelect: (id: number) => void;
}

export function AttentionPanel({ mesas, limiares, onSelect }: AttentionPanelProps) {
  const lista = mesas
    .filter((m) => precisaAtencao(derivarEstado(m, limiares)))
    .sort((a, b) => (b.semPedido ?? 0) - (a.semPedido ?? 0));

  if (lista.length === 0) {
    return (
      <p className="text-[13px] leading-relaxed text-(--color-ink-2)">
        Nenhuma mesa pedindo atenção neste ambiente.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {lista.map((mesa) => {
        const estado = derivarEstado(mesa, limiares);
        const praca = PRACAS.find((p) => p.id === mesa.pracaId && p.ambienteId === mesa.ambienteId);

        return (
          <button
            key={mesa.id}
            type="button"
            onClick={() => onSelect(mesa.id)}
            aria-label={`Mesa ${mesa.id}, ${ROTULO_CURTO[estado]}`}
            className="flex min-h-16 w-full items-center gap-3.5 rounded-2xl bg-(--color-sunken)/55 p-3 text-left transition-colors duration-150 hover:bg-(--color-sunken) focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)"
          >
            <span
              aria-hidden
              className="grid size-10 flex-none place-items-center rounded-xl text-[15px] font-semibold"
              style={{
                background: `var(--color-${estado}-fill)`,
                boxShadow: `inset 0 0 0 ${TRACO_ESTADO[estado]}px var(--color-${estado}-stroke)`,
                color: `var(--color-${estado}-ink)`,
              }}
            >
              {mesa.id}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold leading-tight tracking-tight">
                {ROTULO_CURTO[estado]}
              </span>
              <span className="tnum mt-1 block text-[12px] leading-tight text-(--color-ink-2)">
                {mesa.pessoas} pessoas
                {mesa.abertaHa ? ` · ${formatarDuracao(mesa.abertaHa)}` : ""}
                {praca ? ` · ${praca.garcom}` : ""}
              </span>
            </span>

            {estado === "conta" ? (
              <span className="tnum flex-none font-[family-name:var(--font-mono)] text-[14px] font-semibold">
                {mesa.total}
              </span>
            ) : (
              <span className="tnum flex-none font-[family-name:var(--font-mono)] text-[22px] font-semibold leading-none">
                {mesa.semPedido}
                <span className="ml-1 font-[family-name:var(--font-sans)] text-[11px] font-medium text-(--color-ink-3)">
                  min
                </span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
