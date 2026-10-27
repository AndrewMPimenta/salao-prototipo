"use client";

import type { Salao } from "@/hooks/use-salao";
import type { Folga } from "./tipos";
import { FloorPlan } from "../floor-plan";
import { TimelineView } from "../timeline-view";

/** Planta e linha do tempo: superfície opaca e rolável, centralizada no espaço que a interface deixa livre. */
export function PainelVista({ salao, folga }: { salao: Salao; folga: Folga }) {
  const { vista } = salao;

  return (
    <div
      style={{ top: folga.topo, bottom: folga.base, left: folga.esquerda, right: folga.direita }}
      className="animate-surgir absolute z-0 overflow-y-auto rounded-[24px] bg-(--color-surface) p-6 shadow-(--shadow-card) ring-1 ring-(--color-ink)/6"
    >
      <div className="mx-auto max-w-[1100px]">
        {vista === "planta" && (
          <FloorPlan
            mesas={salao.mesasVisiveis}
            ambienteId={salao.ambienteId}
            limiares={salao.limiares}
            densidade="padrao"
            filtro={salao.filtro}
            selecionada={salao.selecionada}
            onSelect={salao.alternarSelecao}
            onEscape={() => salao.selecionar(null)}
          />
        )}
        {vista === "linha" && <TimelineView mesas={salao.mesas} limiares={salao.limiares} />}
      </div>
    </div>
  );
}
