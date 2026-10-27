"use client";

import type { Limiares, Mesa } from "@/lib/types";
import { derivarEstado, minutosAteLiberar } from "@/lib/state";
import { cn } from "@/lib/utils";

const HORIZONTE = 120;

interface TimelineViewProps {
  mesas: Mesa[];
  limiares: Limiares;
}

/**
 * A planta não responde "quando libera", porque a resposta não é espacial.
 * Cada mesa é uma faixa: trecho sólido é o decorrido, hachurado é a previsão
 * a partir da permanência média.
 *
 * Cuidado ao vender isto: a previsão é só uma média. Mesa que acabou de pedir
 * sobremesa e mesa esperando a conta aparecem iguais aqui.
 */
export function TimelineView({ mesas, limiares }: TimelineViewProps) {
  const livres = mesas.filter((m) => m.pessoas === 0);
  const ocupadas = mesas
    .filter((m) => m.pessoas > 0)
    .sort((a, b) => (a.abertaHa ?? 0) - (b.abertaHa ?? 0));

  const ticks = Array.from({ length: HORIZONTE / 30 + 1 }, (_, i) => i * 30);

  return (
    <div className="p-4">
      <div className="mb-1.5 grid grid-cols-[62px_1fr] gap-2.5">
        <div />
        <div className="flex justify-between font-mono text-[10.5px] text-(--color-ink-3)">
          {ticks.map((t) => (
            <span key={t}>+{t}′</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[62px_1fr] items-center gap-x-2.5 gap-y-[3px] text-xs">
        {livres.map((m) => (
          <Linha key={m.id} mesa={m} livre />
        ))}
        {ocupadas.map((m) => {
          const restam = minutosAteLiberar(m, limiares);
          const estado = derivarEstado(m, limiares);
          return <Linha key={m.id} mesa={m} restam={restam} estado={estado} />;
        })}
      </div>
    </div>
  );
}

function Linha({
  mesa,
  livre,
  restam = 0,
  estado,
}: {
  mesa: Mesa;
  livre?: boolean;
  restam?: number;
  estado?: string;
}) {
  const largura = Math.min(100, (restam / HORIZONTE) * 100);
  const passou = !livre && restam === 0;

  return (
    <>
      <div className="tnum flex items-center justify-end gap-1.5 font-semibold">
        {mesa.id}
        <span className="font-normal text-(--color-ink-3)">{mesa.lugares}p</span>
      </div>
      <div className="relative h-6.5 overflow-hidden rounded-md bg-(--color-sunken)">
        {livre ? (
          <Barra largura={100} estado="livre" texto="livre agora" />
        ) : passou ? (
          <Barra largura={100} estado={estado!} texto={`passou da média · ${mesa.abertaHa}′ na mesa`} />
        ) : (
          <>
            <Barra largura={largura} estado={estado!} texto={`libera ~${restam}′`} />
            <div
              aria-hidden
              className="absolute inset-y-0 rounded-md border-2 border-dashed border-(--color-line-2)"
              style={{ left: `${largura}%`, width: `${Math.min(28, 100 - largura)}%` }}
            />
          </>
        )}
        <div aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-(--color-focus)" />
      </div>
    </>
  );
}

function Barra({ largura, estado, texto }: { largura: number; estado: string; texto: string }) {
  return (
    <div
      className={cn(
        "absolute inset-y-0 flex items-center overflow-hidden rounded-md px-1.5",
        "whitespace-nowrap text-[10.5px] font-semibold",
      )}
      style={{
        left: 0,
        width: `${largura}%`,
        background: `var(--color-${estado}-fill)`,
        boxShadow: `inset 0 0 0 2px var(--color-${estado}-stroke)`,
        color: `var(--color-${estado}-ink)`,
      }}
    >
      {texto}
    </div>
  );
}
