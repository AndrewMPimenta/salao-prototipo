import type { ReactNode } from "react";
import type { EstadoMesa } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Mesmo aro da mesa 3D: sólido ink, tracejado, fio cinza e azul da conta. */
const ARO: Record<EstadoMesa, string> = {
  livre: "border-[2.5px] border-solid border-(--color-ink)",
  reservada: "border-2 border-dashed border-(--color-ink-2)",
  ocupada: "border border-solid border-(--color-ink-3)",
  conta: "border-[2.5px] border-solid border-(--color-conta-stroke)",
};

/** Miniatura do tampo com o aro do estado, para a legenda e as listas. */
export function AmostraAro({
  estado,
  className,
  children,
}: {
  estado: EstadoMesa;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <span aria-hidden className={cn("box-border flex-none rounded-full bg-(--color-raised)", ARO[estado], className)}>
      {children}
    </span>
  );
}
