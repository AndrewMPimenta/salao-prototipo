import type { EstadoMesa } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Amostra do estado na legenda e nas listas, no mesmo destaque da cena (friso, tampo ou brilho;
 * o CSS lê `data-destaque` na raiz). Ocupada não tem cor de sinal: fica neutra.
 */
export function AmostraEstado({ estado, className }: { estado: EstadoMesa; className?: string }) {
  if (estado === "ocupada") return <span aria-hidden className={cn("amostra-neutra flex-none", className)} />;
  return (
    <span
      aria-hidden
      className={cn("amostra flex-none", className)}
      style={{ "--c": `var(--color-brilho-${estado})` } as React.CSSProperties}
    />
  );
}
