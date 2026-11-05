import type { Ambiente } from "@/lib/types";

const PREFIXO = "Hot Beach ";

/**
 * Os salões do Hot Beach são do mesmo cliente: o breadcrumb mostra o grupo e o salão, sem repetir o prefixo.
 * Os demais salões não têm grupo.
 */
export function nomeDoSalao(ambiente: Ambiente | undefined): { grupo: string | null; salao: string } {
  const nome = ambiente?.nome ?? "";
  if (nome.startsWith(PREFIXO)) return { grupo: "Hot Beach", salao: nome.slice(PREFIXO.length) };
  return { grupo: null, salao: nome };
}
