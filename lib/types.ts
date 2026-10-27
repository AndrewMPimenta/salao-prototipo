/** Estado de base, exclusivo: é a cor do tampo. Alerta não é estado. */
export type EstadoMesa = "livre" | "reservada" | "ocupada" | "conta";

/** Em ordem de prioridade do selo. */
export type TipoAlerta = "semPedidoCritico" | "entregaAtrasada" | "semPedido" | "contaParada";

export interface Alerta {
  tipo: TipoAlerta;
  /** Há quantos minutos a condição dura. */
  minutos: number;
}

export type FormaMesa = "redonda" | "retangular";

export interface Reserva {
  /** Horário marcado, "21:30". */
  hora: string;
  nome: string;
  pessoas: number;
  /** Minutos até o horário, a partir do instante dos dados. */
  emMinutos: number;
}

export interface Mesa {
  id: number;
  ambienteId: string;
  pracaId?: string;
  forma: FormaMesa;
  /** Posição no plano, em % da largura/altura do salão. */
  x: number;
  y: number;
  /** Dimensões em px de referência; o render escala a partir daqui. */
  largura: number;
  altura: number;
  lugares: number;
  pessoas: number;
  /** Minutos desde o último pedido, ou desde a abertura se nunca pediu. Indefinido quando livre. */
  semPedido?: number;
  /** Minutos desde a abertura da comanda. */
  abertaHa?: number;
  /** Itens já lançados que ainda não chegaram à mesa. */
  pedidosPendentes?: number;
  /** Minutos desde o lançamento do item pendente mais antigo. */
  pendenteHa?: number;
  contaImpressa?: boolean;
  contaImpressaHa?: number;
  /** Minutos sem comanda, para mesa livre. */
  livreHa?: number;
  /** Próxima reserva da mesa, dentro ou fora da janela de "reservada". */
  reserva?: Reserva;
  /** Consumo da comanda, em reais. */
  total?: number;
}

export interface Ambiente {
  id: string;
  nome: string;
}

export interface Praca {
  id: string;
  ambienteId: string;
  garcom: string;
}

/** Valores em minutos; configuráveis por casa, o protótipo usa os padrões. */
export interface Limiares {
  semPedido: number;
  semPedidoCritico: number;
  entregaAtrasada: number;
  contaParada: number;
  /** Permanência média: fecha o anel do piso e prevê a liberação. */
  permanenciaMedia: number;
  /** Reserva a até esse tempo do horário deixa a mesa "reservada". */
  janelaReserva: number;
}
