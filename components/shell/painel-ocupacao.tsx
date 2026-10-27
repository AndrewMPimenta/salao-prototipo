"use client";

import type { Ref } from "react";
import type { Salao } from "@/hooks/use-salao";
import { OccupancyBar } from "../occupancy-bar";
import { FiltrosRapidos } from "./filtros-rapidos";
import { Atualizado, EstatisticasLinha, Lotacao, textoComandas } from "./resumo";
import { materializar } from "./materializar";
import { cn } from "@/lib/utils";

interface PainelOcupacaoProps {
  salao: Salao;
  nomeAmbiente: string;
  aberto: boolean;
  medir: Ref<HTMLElement>;
}

/** Canto inferior esquerdo do desktop: o resumo do salão sempre à vista. */
export function PainelOcupacao({ salao, nomeAmbiente, aberto, medir }: PainelOcupacaoProps) {
  const { resumo } = salao;

  return (
    <section
      ref={medir}
      inert={!aberto}
      aria-label={`Ocupação do ${nomeAmbiente}`}
      className={cn(
        "glass absolute bottom-[calc(env(safe-area-inset-bottom)+16px)] left-[calc(env(safe-area-inset-left)+16px)] z-10",
        "w-[min(380px,calc(100vw-32px))] rounded-(--radius-panel) p-4",
        materializar(aberto),
      )}
    >
      <header className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="m-0 truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-(--color-ink-3)">
          Ocupação · {nomeAmbiente}
        </h2>
        <Atualizado className="flex-none" />
      </header>

      <p className="tnum m-0 mb-3 text-[13px] leading-4 text-(--color-ink-2)">{textoComandas(resumo)}</p>
      <EstatisticasLinha resumo={resumo} />
      <Lotacao resumo={resumo} className="mt-3" />

      <div className="mt-3 flex flex-col gap-1 border-t border-(--color-ink)/10 pt-3">
        <FiltrosRapidos
          valor={salao.filtroRapido}
          atencao={resumo.atencao}
          onChange={salao.definirRapido}
          className="flex [&>button]:flex-1"
        />
        <OccupancyBar
          variante="legenda"
          contagem={resumo.contagem}
          total={resumo.total}
          filtro={salao.filtro}
          onFiltrar={salao.filtrar}
          alertas={resumo.atencao}
          alertaAtivo={salao.filtroRapido === "atencao"}
          onAlertas={() => salao.definirRapido(salao.filtroRapido === "atencao" ? "todas" : "atencao")}
        />
      </div>
    </section>
  );
}
