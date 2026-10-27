"use client";

import type { Limiares, Mesa } from "@/lib/types";
import { PRACAS } from "@/lib/data";
import { ROTULO_ALERTA, textoAlerta, triarMesas } from "@/lib/state";
import { cn, formatarDuracao } from "@/lib/utils";
import type { ArmazemHover } from "@/hooks/use-hover-mesa";
import { FichaAlerta } from "./selo-alerta";

interface AttentionPanelProps {
  mesas: Mesa[];
  limiares: Limiares;
  onSelect: (id: number) => void;
  hover?: ArmazemHover;
}

export function AttentionPanel({ mesas, limiares, onSelect, hover }: AttentionPanelProps) {
  const lista = triarMesas(mesas, limiares);

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
      {lista.map(({ mesa, alertas }, i) => {
        const [principal, ...outros] = alertas;
        const praca = PRACAS.find((p) => p.id === mesa.pracaId && p.ambienteId === mesa.ambienteId);

        return (
          <li key={mesa.id} className={cn(i > 0 && "border-t border-(--color-line)")}>
            <button
              type="button"
              onClick={() => onSelect(mesa.id)}
              onPointerEnter={(e) => e.pointerType === "mouse" && hover?.definir(mesa.id)}
              onPointerLeave={() => hover?.ler() === mesa.id && hover.definir(null)}
              aria-label={`Mesa ${mesa.id}. ${alertas.map(textoAlerta).join(". ")}`}
              className={cn(
                "-mx-2 flex min-h-16 w-[calc(100%+1rem)] items-center gap-3 rounded-(--radius-control) px-2 py-3 text-left",
                "transition-[background-color,transform] duration-100 hover:bg-(--color-ink)/5 active:scale-[0.98]",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)",
              )}
            >
              <span className="tnum w-8 flex-none text-right text-[16px] font-semibold text-(--color-ink)">{mesa.id}</span>

              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-[15px] font-semibold leading-5">
                  <FichaAlerta tipo={principal.tipo} className="size-[18px]" />
                  <span className="truncate">{ROTULO_ALERTA[principal.tipo]}</span>
                  {outros.length > 0 && (
                    <span className="tnum flex-none text-[12px] font-medium text-(--color-ink-2)">+{outros.length}</span>
                  )}
                </span>
                <span className="tnum mt-0.5 block truncate text-xs leading-4 text-(--color-ink-2)">
                  {mesa.pessoas} pessoas
                  {mesa.abertaHa ? ` · ${formatarDuracao(mesa.abertaHa)}` : ""}
                  {praca ? ` · ${praca.garcom}` : ""}
                </span>
              </span>

              <span className="tnum flex-none font-[family-name:var(--font-mono)] text-[17px] font-semibold leading-none">
                {principal.minutos}
                <span className="ml-1 font-sans text-[11px] font-medium text-(--color-ink-3)">min</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
