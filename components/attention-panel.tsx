"use client";

import type { Limiares, Mesa } from "@/lib/types";
import { PRACAS } from "@/lib/data";
import { derivarEstado, precisaAtencao, ROTULO_CURTO, TRACO_ESTADO } from "@/lib/state";
import { cn, formatarDuracao } from "@/lib/utils";

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
      <p className="text-sm leading-relaxed text-(--color-ink-2)">
        Nenhuma mesa pedindo atenção neste ambiente.
      </p>
    );
  }

  /*
    Lista com divisórias finas em vez de um cartão por mesa: o painel já é uma
    superfície, e caixas dentro de caixa empilham fundos sem dizer nada a mais.
  */
  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {lista.map((mesa, i) => {
        const estado = derivarEstado(mesa, limiares);
        const praca = PRACAS.find((p) => p.id === mesa.pracaId && p.ambienteId === mesa.ambienteId);

        return (
          <li key={mesa.id} className={cn(i > 0 && "border-t border-(--color-line)")}>
            <button
              type="button"
              onClick={() => onSelect(mesa.id)}
              aria-label={`Mesa ${mesa.id}, ${ROTULO_CURTO[estado]}`}
              className={cn(
                "-mx-2 flex min-h-16 w-[calc(100%+1rem)] items-center gap-3 rounded-(--radius-control) px-2 py-3 text-left",
                "transition-[background-color,transform] duration-100 hover:bg-(--color-ink)/5 active:scale-[0.98]",
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
                <span className="block text-[15px] font-semibold leading-5">
                  {ROTULO_CURTO[estado]}
                </span>
                <span className="tnum mt-0.5 block truncate text-xs leading-4 text-(--color-ink-2)">
                  {mesa.pessoas} pessoas
                  {mesa.abertaHa ? ` · ${formatarDuracao(mesa.abertaHa)}` : ""}
                  {praca ? ` · ${praca.garcom}` : ""}
                  {mesa.pedidosPendentes ? ` · ${mesa.pedidosPendentes} ${mesa.pedidosPendentes === 1 ? "pedido pendente" : "pedidos pendentes"}` : ""}
                </span>
              </span>

              {estado === "conta" ? (
                <span className="tnum flex-none font-[family-name:var(--font-mono)] text-[15px] font-semibold">
                  {mesa.total}
                </span>
              ) : (
                <span className="tnum flex-none font-[family-name:var(--font-mono)] text-[17px] font-semibold leading-none">
                  {mesa.semPedido}
                  <span className="ml-1 font-sans text-[11px] font-medium text-(--color-ink-3)">
                    min
                  </span>
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
