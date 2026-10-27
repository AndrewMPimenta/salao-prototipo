import type { EstadoMesa, Limiares, Mesa } from "./types";

export const LIMIARES_PADRAO: Limiares = {
  alerta1: 20,
  alerta2: 40,
  permanenciaMedia: 35,
};

/**
 * O estado é derivado, nunca armazenado. Mudar um limiar reclassifica o salão
 * inteiro sem tocar nos dados — que é o que torna o painel de teste possível.
 */
export function derivarEstado(mesa: Mesa, limiares: Limiares): EstadoMesa {
  if (mesa.pessoas === 0) return "livre";
  if (mesa.contaImpressa) return "conta";
  const semPedido = mesa.semPedido ?? 0;
  if (semPedido >= limiares.alerta2) return "alerta2";
  if (semPedido >= limiares.alerta1) return "alerta1";
  return "ocupada";
}

export function precisaAtencao(estado: EstadoMesa): boolean {
  return estado === "alerta1" || estado === "alerta2" || estado === "conta";
}

/** Previsão de liberação, em minutos. `0` significa que já passou da média. */
export function minutosAteLiberar(mesa: Mesa, limiares: Limiares): number {
  if (mesa.pessoas === 0) return 0;
  return Math.max(0, limiares.permanenciaMedia - (mesa.abertaHa ?? 0));
}

export const ROTULO_ESTADO: Record<EstadoMesa, string> = {
  livre: "Livre",
  ocupada: "Ocupada",
  alerta1: "Sem pedido há 20 min ou mais",
  alerta2: "Sem pedido há 40 min ou mais",
  conta: "Conta impressa, aguardando pagamento",
};

export const ROTULO_CURTO: Record<EstadoMesa, string> = {
  livre: "Livre",
  ocupada: "Ocupada",
  alerta1: "Sem pedido",
  alerta2: "Sem pedido",
  conta: "Conta impressa",
};

/** O glifo é o carregador redundante que sobrevive à escala de cinza. */
export const GLIFO_ESTADO: Partial<Record<EstadoMesa, string>> = {
  alerta1: "!",
  alerta2: "!!",
  conta: "R$",
};

/** Espessura do traço em px. Escala junto com a urgência. */
export const TRACO_ESTADO: Record<EstadoMesa, number> = {
  livre: 2,
  ocupada: 2,
  alerta1: 3,
  alerta2: 4,
  conta: 3,
};

export const ORDEM_ESTADOS: EstadoMesa[] = [
  "livre",
  "ocupada",
  "alerta1",
  "alerta2",
  "conta",
];

/** Peso para ordenar a triagem: urgência primeiro, tempo como desempate. */
export function pesoTriagem(estado: EstadoMesa, semPedido = 0): number {
  const base: Record<EstadoMesa, number> = {
    alerta2: 1000,
    conta: 600,
    alerta1: 400,
    ocupada: 100,
    livre: 0,
  };
  return base[estado] + semPedido;
}
