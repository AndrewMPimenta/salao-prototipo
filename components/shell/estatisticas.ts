import type { EstadoMesa, Limiares, Mesa } from "@/lib/types";
import { derivarAlertas, derivarEstado, ORDEM_ESTADOS } from "@/lib/state";

export interface Resumo {
  contagem: Record<EstadoMesa, number>;
  total: number;
  livres: number;
  /** Mesas com comanda aberta, com ou sem conta impressa. */
  ocupadas: number;
  /** Comandas abertas; mesa ocupada sem lista de comandas conta como uma. */
  comandas: number;
  /** Mesas com pelo menos um alerta. */
  atencao: number;
  pessoas: number;
  /** Pessoas sobre lugares, em %. É lotação de cadeiras, não de mesas. */
  lotacao: number;
}

export function resumir(mesas: Mesa[], limiares: Limiares): Resumo {
  const contagem = Object.fromEntries(ORDEM_ESTADOS.map((e) => [e, 0])) as Record<EstadoMesa, number>;
  let pessoas = 0;
  let lugares = 0;
  let atencao = 0;
  let comandas = 0;
  for (const m of mesas) {
    const estado = derivarEstado(m, limiares);
    contagem[estado]++;
    if (estado === "ocupada" || estado === "conta") comandas += m.comandas?.length || 1;
    if (derivarAlertas(m, limiares).length > 0) atencao++;
    pessoas += m.pessoas;
    lugares += m.lugares;
  }
  return {
    contagem,
    total: mesas.length,
    livres: contagem.livre,
    ocupadas: contagem.ocupada + contagem.conta,
    comandas,
    atencao,
    pessoas,
    lotacao: lugares ? Math.round((pessoas / lugares) * 100) : 0,
  };
}
