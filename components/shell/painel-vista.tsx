"use client";

import type { Salao } from "@/hooks/use-salao";
import type { Folga } from "./tipos";
import { cn } from "@/lib/utils";
import { FloorPlan } from "../floor-plan";
import { TimelineView } from "../timeline-view";

/** Planta e linha do tempo: superfície opaca e rolável, centralizada no espaço que a interface deixa livre. */
export function PainelVista({ salao, folga }: { salao: Salao; folga: Folga }) {
  const { vista } = salao;

  return (
    <div
      style={{ top: folga.topo, bottom: folga.base, left: folga.esquerda, right: folga.direita }}
      className={cn(
        "animate-surgir absolute z-0 rounded-[24px] bg-(--color-surface) shadow-(--shadow-card) ring-1 ring-(--color-ink)/6",
        vista === "planta" ? "overflow-hidden p-4" : "overflow-y-auto p-6",
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
