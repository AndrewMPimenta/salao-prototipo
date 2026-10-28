import type { EstadoMesa } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Amostra do estado na legenda e nas listas, no mesmo destaque da cena (friso, tampo ou brilho;
 * o CSS lê `data-destaque` na raiz). Ocupada usa a tinta do tema, de luminância oposta à da livre.
 */
export function AmostraEstado({ estado, className }: { estado: EstadoMesa; className?: string }) {
  if (estado === "livre") return <span aria-hidden className={cn("amostra-livre flex-none", className)} />;
  if (estado === "ocupada") return <span aria-hidden className={cn("amostra-ocupada flex-none", className)} />;
  return (
    <span
      aria-hidden
      className={cn("amostra flex-none", className)}
      style={{ "--c": `var(--color-brilho-${estado})`, "--topo": `var(--color-topo-${estado})` } as React.CSSProperties}
    />
  );
}
