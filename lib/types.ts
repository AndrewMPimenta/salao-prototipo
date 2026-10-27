export type EstadoMesa = "livre" | "ocupada" | "alerta1" | "alerta2" | "conta";

export type FormaMesa = "redonda" | "retangular";

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
  /** Minutos sem pedido. Indefinido quando a mesa está livre. */
  semPedido?: number;
  /** Minutos desde a abertura da comanda. */
  abertaHa?: number;
  contaImpressa?: boolean;
  total?: string;
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

export interface Limiares {
  /** Minutos para o primeiro aviso. */
  alerta1: number;
  /** Minutos para o segundo aviso. */
  alerta2: number;
  /** Permanência média usada para prever liberação. */
  permanenciaMedia: number;
}
