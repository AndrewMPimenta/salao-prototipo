import type { Mesa } from "./types";
import { posicoesCadeiras, type PosicaoCadeira } from "./geometria";

/*
  Numeração das posições. `posicoesCadeiras` devolve as cadeiras na ordem de desenho: na mesa
  retangular, primeiro um lado inteiro e depois o outro, ambos da esquerda para a direita (ou de
  cima para baixo). A posição P1…Pn precisa seguir o sentido horário, a partir da cabeceira, então
  o segundo lado é percorrido de trás para a frente. Mesa redonda já vem em sentido horário.
*/

function lados(mesa: Mesa): { primeiro: number; segundo: number; vertical: boolean } {
  const primeiro = Math.ceil(mesa.lugares / 2);
  return { primeiro, segundo: mesa.lugares - primeiro, vertical: mesa.altura > mesa.largura };
}

/** Índice na ordem de desenho (`posicoesCadeiras`) da cadeira da posição `numero` (1…lugares). */
export function indiceDaPosicao(mesa: Mesa, numero: number): number {
  if (mesa.forma === "redonda") return numero - 1;
  const { primeiro, segundo, vertical } = lados(mesa);
  // Mesa vertical começa pelo lado direito (segundo grupo), descendo; a horizontal, pelo de cima.
  const [a, b] = vertical ? [segundo, primeiro] : [primeiro, segundo];
  const base = vertical ? primeiro : 0;
  if (numero <= a) return base + numero - 1;
  return vertical ? b - (numero - a) : primeiro + (b - (numero - a));
}

/** Número da posição (1…lugares) da cadeira no índice de desenho `indice`. */
export function posicaoDaCadeira(mesa: Mesa, indice: number): number {
  for (let n = 1; n <= mesa.lugares; n++) if (indiceDaPosicao(mesa, n) === indice) return n;
  return indice + 1;
}

export interface CadeiraNumerada extends PosicaoCadeira {
  numero: number;
}

/** Cadeiras com a numeração das posições, em coordenadas locais da mesa (px de referência). */
export function cadeirasNumeradas(mesa: Mesa): CadeiraNumerada[] {
  const cadeiras = posicoesCadeiras(mesa);
  return Array.from({ length: mesa.lugares }, (_, i) => ({ numero: i + 1, ...cadeiras[indiceDaPosicao(mesa, i + 1)] }));
}
