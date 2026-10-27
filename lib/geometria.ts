import type { Mesa } from "./types";

export interface PosicaoCadeira {
  x: number;
  y: number;
  largura: number;
  altura: number;
}

/**
 * Cadeiras ficam DO LADO DE FORA da mesa, onde cadeiras ficam. As preenchidas
 * contam pessoas — é o quinto carregador de informação, independente da cor.
 */
export function posicoesCadeiras(mesa: Mesa): PosicaoCadeira[] {
  const out: PosicaoCadeira[] = [];

  if (mesa.forma === "redonda") {
    for (let i = 0; i < mesa.lugares; i++) {
      const a = (i / mesa.lugares) * Math.PI * 2 - Math.PI / 2;
      out.push({
        x: Math.cos(a) * (mesa.largura / 2 + 9),
        y: Math.sin(a) * (mesa.altura / 2 + 9),
        largura: 12,
        altura: 12,
      });
    }
    return out;
  }

  const vertical = mesa.altura > mesa.largura;
  const porLado = Math.ceil(mesa.lugares / 2);

  for (let i = 0; i < mesa.lugares; i++) {
    const lado = i < porLado ? -1 : 1;
    const indice = i < porLado ? i : i - porLado;
    const total = i < porLado ? porLado : mesa.lugares - porLado;
    const fracao = (indice + 1) / (total + 1) - 0.5;

    out.push(
      vertical
        ? { x: lado * (mesa.largura / 2 + 8), y: fracao * mesa.altura, largura: 10, altura: 15 }
        : { x: fracao * mesa.largura, y: lado * (mesa.altura / 2 + 8), largura: 15, altura: 10 },
    );
  }

  return out;
}

/**
 * Vizinha mais próxima NA DIREÇÃO pedida, geometricamente — não a próxima do
 * DOM. O peso 2.2 no eixo perpendicular faz a seta preferir quem está alinhado.
 */
export function vizinhaNaDirecao(
  origem: Mesa,
  candidatas: Mesa[],
  direcao: "cima" | "baixo" | "esquerda" | "direita",
): Mesa | null {
  const filtradas = candidatas.filter((t) => {
    if (t.id === origem.id) return false;
    const dx = t.x - origem.x;
    const dy = t.y - origem.y;
    if (direcao === "direita") return dx > 1;
    if (direcao === "esquerda") return dx < -1;
    if (direcao === "baixo") return dy > 1;
    return dy < -1;
  });

  if (filtradas.length === 0) return null;

  const horizontal = direcao === "esquerda" || direcao === "direita";
  const custo = (t: Mesa) => {
    const dx = Math.abs(t.x - origem.x);
    const dy = Math.abs(t.y - origem.y);
    return horizontal ? dx + dy * 2.2 : dy + dx * 2.2;
  };

  return filtradas.sort((a, b) => custo(a) - custo(b))[0];
}
