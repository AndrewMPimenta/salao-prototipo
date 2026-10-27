"use client";

import type { EstadoMesa, Limiares, Mesa } from "@/lib/types";
import { FIXTURES } from "@/lib/data";
import { derivarAlertas, derivarEstado } from "@/lib/state";
import { Cadeiras, TableShape, type Densidade } from "./table-shape";
import { useSpatialKeyboard } from "@/hooks/use-spatial-keyboard";
import { cn } from "@/lib/utils";

interface FloorPlanProps {
  mesas: Mesa[];
  ambienteId: string;
  limiares: Limiares;
  densidade: Densidade;
  filtro: EstadoMesa | null;
  selecionada: number | null;
  escala?: number;
  somenteLeitura?: boolean;
  onSelect: (id: number) => void;
  onEscape: () => void;
}

export function FloorPlan({
  mesas,
  ambienteId,
  limiares,
  densidade,
  filtro,
  selecionada,
  escala = 1,
  somenteLeitura,
  onSelect,
  onEscape,
}: FloorPlanProps) {
  useSpatialKeyboard({ mesas, ativo: !somenteLeitura, onEscape });

  const fixtures = FIXTURES[ambienteId] ?? [];
  let primeiraFocavel = true;

  return (
    <div
      role="group"
      aria-label="Planta do salão. As setas percorrem as mesas e Enter abre os detalhes."
      /*
        O piso é uma superfície lisa e rebaixada, sem grade: linhas de papel
        milimetrado competiriam com as mesas pela atenção.
      */
      className={cn(
        "relative aspect-16/10 w-full overflow-hidden rounded-(--radius-panel) bg-(--color-floor)",
        "shadow-[inset_0_1px_3px_rgb(40_30_15/0.08),inset_0_0_0_1px_var(--color-line)]",
      )}
    >
      {fixtures.map((f) => (
        <div
          key={f.nome}
          aria-hidden
          className={cn(
            "absolute flex items-center justify-center text-[10px] font-medium",
            "uppercase tracking-[0.06em] text-(--color-ink-3)",
            f.solido ? "rounded-[4px] bg-(--color-ink)/8" : "rounded-lg bg-(--color-ink)/4",
          )}
          style={{
            left: `${f.x}%`,
            top: `${f.y}%`,
            width: `${f.largura}%`,
            height: `${f.altura}%`,
          }}
        >
          {f.nome}
        </div>
      ))}

      {mesas.map((mesa) => {
        const estado = derivarEstado(mesa, limiares);
        const atenuada = filtro !== null && estado !== filtro;
        const tabIndex = !somenteLeitura && primeiraFocavel ? 0 : -1;
        if (tabIndex === 0) primeiraFocavel = false;

        return (
          <div key={mesa.id}>
            <Cadeiras mesa={mesa} escala={escala} />
            <TableShape
              mesa={mesa}
              estado={estado}
              alertas={derivarAlertas(mesa, limiares)}
              densidade={densidade}
              escala={escala}
              selecionada={selecionada === mesa.id}
              atenuada={atenuada}
              somenteLeitura={somenteLeitura}
              onSelect={onSelect}
              tabIndex={tabIndex}
            />
          </div>
        );
      })}
    </div>
  );
}
