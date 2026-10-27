"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { EstadoMesa, Limiares, Mesa } from "@/lib/types";
import { FIXTURES } from "@/lib/data";
import { derivarAlertas, derivarEstado } from "@/lib/state";
import { Cadeiras, TableShape, type Densidade } from "./table-shape";
import { useSpatialKeyboard } from "@/hooks/use-spatial-keyboard";
import { cn } from "@/lib/utils";
import { ms, obterCenario } from "./three/cenarios";

/** Menor mesa legível em px; abaixo disso a planta deixa de caber e passa a rolar. */
const MESA_MIN_PX = 12;
/** Respiro em metros em volta de campo e marcos, onde ficam cadeiras e glow. */
const MARGEM_M = 0.8;

interface FloorPlanProps {
  mesas: Mesa[];
  ambienteId: string;
  limiares: Limiares;
  densidade: Densidade;
  filtro: EstadoMesa | null;
  selecionada: number | null;
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
  somenteLeitura,
  onSelect,
  onEscape,
}: FloorPlanProps) {
  useSpatialKeyboard({ mesas, ativo: !somenteLeitura, onEscape });

  const fixtures = FIXTURES[ambienteId] ?? [];
  let primeiraFocavel = true;

  const area = useRef<HTMLDivElement>(null);
  const [caixa, setCaixa] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = area.current;
    if (!el) return;
    const medir = () => setCaixa({ w: el.clientWidth, h: el.clientHeight });
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // O mundo em metros é o campo de mesas do cenário 3D mais os marcos que sobram fora dele.
  const geo = useMemo(() => {
    const c = obterCenario(ambienteId);
    let x0 = 0;
    let y0 = 0;
    let x1 = c.campoL;
    let y1 = c.campoP;
    for (const f of fixtures) {
      x0 = Math.min(x0, (f.x / 100) * c.campoL);
      y0 = Math.min(y0, (f.y / 100) * c.campoP);
      x1 = Math.max(x1, ((f.x + f.largura) / 100) * c.campoL);
      y1 = Math.max(y1, ((f.y + f.altura) / 100) * c.campoP);
    }
    const menor = Math.min(...mesas.map((m) => Math.max(m.largura, m.altura)));
    return {
      campoL: c.campoL,
      campoP: c.campoP,
      x0: x0 - MARGEM_M,
      y0: y0 - MARGEM_M,
      mundoL: x1 - x0 + 2 * MARGEM_M,
      mundoP: y1 - y0 + 2 * MARGEM_M,
      menorMesaM: ms(menor),
    };
  }, [ambienteId, fixtures, mesas]);

  const pxPorM = useMemo(() => {
    if (caixa.w === 0 || caixa.h === 0) return 0;
    const cabe = Math.min(caixa.w / geo.mundoL, caixa.h / geo.mundoP);
    return Math.max(cabe, MESA_MIN_PX / geo.menorMesaM);
  }, [caixa, geo]);

  const escala = ms(1) * pxPorM;

  return (
    <div ref={area} className="flex h-full w-full overflow-auto">
      {pxPorM > 0 && (
        <div
          role="group"
          aria-label="Planta do salão. As setas percorrem as mesas e Enter abre os detalhes."
          /*
        O piso é uma superfície lisa e rebaixada, sem grade: linhas de papel
        milimetrado competiriam com as mesas pela atenção.
      */
          className={cn(
            "relative m-auto shrink-0 rounded-(--radius-panel) bg-(--color-floor)",
            "shadow-[inset_0_1px_3px_rgb(40_30_15/0.08),inset_0_0_0_1px_var(--color-line)]",
          )}
          style={{ width: geo.mundoL * pxPorM, height: geo.mundoP * pxPorM }}
        >
          <div
            className="absolute"
            style={{
              left: -geo.x0 * pxPorM,
              top: -geo.y0 * pxPorM,
              width: geo.campoL * pxPorM,
              height: geo.campoP * pxPorM,
            }}
          >
            {fixtures.map((f) => (
              <div
                key={f.nome}
                aria-hidden
                className={cn(
                  "absolute flex items-center justify-center text-[10px] font-medium",
                  "uppercase tracking-[0.06em] text-(--color-ink-3)",
                  f.solido
                    ? "rounded-[4px] bg-(--color-ink)/8"
                    : "rounded-lg bg-(--color-ink)/4",
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
        </div>
      )}
    </div>
  );
}
