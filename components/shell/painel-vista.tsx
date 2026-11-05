"use client";

import type { Salao } from "@/hooks/use-salao";
import { cn } from "@/lib/utils";
import { FloorPlan } from "../floor-plan";
import { TimelineView } from "../timeline-view";

/** Planta e linha do tempo: superfície rolável que preenche o cartão da cena. */
export function PainelVista({ salao, ilustrativo }: { salao: Salao; ilustrativo: boolean }) {
  const { vista } = salao;

  return (
    <div
      className={cn(
        "absolute inset-0 bg-card",
        vista === "planta" ? "overflow-hidden p-4" : "overflow-y-auto p-6",
        // A faixa de cima é do selo "Layout ilustrativo".
        ilustrativo && "pt-11",
      )}
    >
      <div className={vista === "planta" ? "h-full" : "mx-auto max-w-[1100px]"}>
        {vista === "planta" && (
          <FloorPlan
            mesas={salao.mesas}
            ambienteId={salao.ambienteId}
            limiares={salao.limiares}
            densidade="padrao"
            exibicao={salao.exibicao}
            filtro={salao.filtro}
            destacar={salao.destacar}
            selecionada={salao.selecionada}
            hover={salao.hover}
            layout={salao.layout}
            posicaoSelecionada={salao.posicaoSelecionada}
            onSelecionarPosicao={salao.selecionarPosicao}
            onSelect={salao.alternarSelecao}
            onEscape={() => salao.selecionar(null)}
          />
        )}
        {vista === "linha" && <TimelineView mesas={salao.mesas} limiares={salao.limiares} />}
      </div>
    </div>
  );
}
