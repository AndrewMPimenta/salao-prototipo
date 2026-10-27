"use client";

import type { Ambiente, Limiares, Mesa } from "@/lib/types";
import { derivarEstado, precisaAtencao } from "@/lib/state";
import { cn } from "@/lib/utils";

interface ZoneRailProps {
  ambientes: Ambiente[];
  mesas: Mesa[];
  limiares: Limiares;
  ativo: string;
  onChange: (id: string) => void;
}

export function ZoneRail({ ambientes, mesas, limiares, ativo, onChange }: ZoneRailProps) {
  return (
    <nav aria-label="Ambientes" className="flex w-56 flex-none flex-col gap-1 px-4 py-6">
      <h3 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-(--color-ink-3)">
        Ambientes
      </h3>

      {ambientes.map((ambiente) => {
        const doAmbiente = mesas.filter((m) => m.ambienteId === ambiente.id);
        const livres = doAmbiente.filter((m) => m.pessoas === 0).length;
        const atencao = doAmbiente.filter((m) => precisaAtencao(derivarEstado(m, limiares))).length;
        const vazio = doAmbiente.length === 0;
        const selecionado = ativo === ambiente.id;

        return (
          <button
            key={ambiente.id}
            type="button"
            disabled={vazio}
            aria-current={selecionado}
            onClick={() => onChange(ambiente.id)}
            className={cn(
              "flex min-h-14 flex-col justify-center gap-0.5 rounded-(--radius-control) px-3 py-2 text-left",
              "transition-[background-color,transform] duration-100 active:scale-[0.97]",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)",
              "disabled:cursor-not-allowed disabled:opacity-35",
              !vazio && !selecionado && "hover:bg-(--color-ink)/5",
              selecionado &&
                "bg-(--color-raised) shadow-[inset_0_0_0_1px_var(--color-line),var(--shadow-table)]",
            )}
          >
            <span
              className={cn(
                "text-[15px] leading-5",
                selecionado ? "font-semibold text-(--color-ink)" : "font-medium text-(--color-ink-2)",
              )}
            >
              {ambiente.nome}
            </span>

            <span className="tnum flex items-center gap-2 text-xs text-(--color-ink-2)">
              {vazio ? (
                "sem mesas"
              ) : (
                <>
                  <span>
                    {livres}/{doAmbiente.length} livres
                  </span>
                  {atencao > 0 && (
                    <span className="flex items-center gap-1 font-medium text-(--color-ink)">
                      <span
                        aria-hidden
                        className="size-2 rounded-full"
                        style={{
                          background: "var(--color-alerta2-fill)",
                          boxShadow: "inset 0 0 0 1.5px var(--color-alerta2-stroke)",
                        }}
                      />
                      {atencao}
                    </span>
                  )}
                </>
              )}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
