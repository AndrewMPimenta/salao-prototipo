import type { Alerta, EstadoMesa, Limiares, Mesa, TipoAlerta } from "./types";
import { formatarDuracao } from "./utils";

export const LIMIARES_PADRAO: Limiares = {
  semPedido: 20,
  semPedidoCritico: 40,
  entregaAtrasada: 15,
  contaParada: 10,
  permanenciaMedia: 35,
  janelaReserva: 30,
};

/**
 * Estado e alertas são derivados, nunca armazenados. Mudar um limiar reclassifica o salão
 * inteiro sem tocar nos dados — que é o que torna o painel de teste possível.
 */
export function derivarEstado(mesa: Mesa, limiares: Limiares): EstadoMesa {
  if (mesa.pessoas > 0) return mesa.contaImpressa ? "conta" : "ocupada";
  if (mesa.reserva && mesa.reserva.emMinutos <= limiares.janelaReserva) return "reservada";
  return "livre";
}

/** Já ordenados pela prioridade do selo. */
export function derivarAlertas(mesa: Mesa, limiares: Limiares): Alerta[] {
  if (mesa.pessoas === 0) return [];

  const alertas: Alerta[] = [];
  const parada = mesa.semPedido ?? 0;
  const pendente = mesa.pendenteHa ?? 0;

  // Com a conta impressa o cliente já não vai pedir: "sem pedido" deixa de ser sinal.
  if (!mesa.contaImpressa) {
    if (parada >= limiares.semPedidoCritico) alertas.push({ tipo: "semPedidoCritico", minutos: parada });
    else if (parada >= limiares.semPedido) alertas.push({ tipo: "semPedido", minutos: parada });
  }
  if ((mesa.pedidosPendentes ?? 0) > 0 && pendente >= limiares.entregaAtrasada) {
    alertas.push({ tipo: "entregaAtrasada", minutos: pendente });
  }
  const contaHa = mesa.contaImpressaHa ?? 0;
  if (mesa.contaImpressa && contaHa >= limiares.contaParada) {
    alertas.push({ tipo: "contaParada", minutos: contaHa });
  }

  return alertas.sort((a, b) => PRIORIDADE_ALERTA[a.tipo] - PRIORIDADE_ALERTA[b.tipo]);
}

export const PRIORIDADE_ALERTA: Record<TipoAlerta, number> = {
  semPedidoCritico: 0,
  entregaAtrasada: 1,
  semPedido: 2,
  contaParada: 3,
};

export function alertaPrincipal(alertas: Alerta[]): Alerta | undefined {
  return alertas[0];
}

/** Só mesas com alerta, pela prioridade do selo e depois pelo tempo. */
export function triarMesas(mesas: Mesa[], limiares: Limiares): { mesa: Mesa; alertas: Alerta[] }[] {
  return mesas
    .map((mesa) => ({ mesa, alertas: derivarAlertas(mesa, limiares) }))
    .filter((t) => t.alertas.length > 0)
    .sort(
      (a, b) =>
        PRIORIDADE_ALERTA[a.alertas[0].tipo] - PRIORIDADE_ALERTA[b.alertas[0].tipo] ||
        b.alertas[0].minutos - a.alertas[0].minutos,
    );
}

/** Previsão de liberação, em minutos. `0` significa que já passou da média. */
export function minutosAteLiberar(mesa: Mesa, limiares: Limiares): number {
  if (mesa.pessoas === 0) return 0;
  return Math.max(0, limiares.permanenciaMedia - (mesa.abertaHa ?? 0));
}

export const ROTULO_ESTADO: Record<EstadoMesa, string> = {
  livre: "Livre",
  reservada: "Reservada",
  ocupada: "Ocupada",
  conta: "Conta impressa, aguardando pagamento",
};

export const ROTULO_CURTO: Record<EstadoMesa, string> = {
  livre: "Livre",
  reservada: "Reservada",
  ocupada: "Ocupada",
  conta: "Conta",
};

export const ROTULO_ALERTA: Record<TipoAlerta, string> = {
  semPedidoCritico: "Sem pedido crítico",
  semPedido: "Sem pedido",
  entregaAtrasada: "Entrega atrasada",
  contaParada: "Conta parada",
};

export function textoAlerta(a: Alerta): string {
  return `${ROTULO_ALERTA[a.tipo]} há ${formatarDuracao(a.minutos)}`;
}

/** O glifo é o carregador redundante que sobrevive à escala de cinza. */
export const GLIFO_ESTADO: Partial<Record<EstadoMesa, string>> = {
  conta: "R$",
};

/** Espessura do traço em px. */
export const TRACO_ESTADO: Record<EstadoMesa, number> = {
  livre: 2,
  reservada: 2,
  ocupada: 2,
  conta: 3,
};

export const ORDEM_ESTADOS: EstadoMesa[] = ["livre", "reservada", "ocupada", "conta"];
