import type { Ambiente, Mesa, Praca } from "./types";

export const AMBIENTES: Ambiente[] = [
  { id: "principal", nome: "Salão Principal" },
  { id: "varanda", nome: "Varanda" },
  { id: "mezanino", nome: "Mezanino" },
];

export const PRACAS: Praca[] = [
  { id: "A", ambienteId: "principal", garcom: "Rafa" },
  { id: "B", ambienteId: "principal", garcom: "Dani" },
  { id: "C", ambienteId: "principal", garcom: "Léo" },
  { id: "D", ambienteId: "principal", garcom: "Bia" },
  { id: "A", ambienteId: "varanda", garcom: "Tati" },
  { id: "B", ambienteId: "varanda", garcom: "Jô" },
  { id: "A", ambienteId: "mezanino", garcom: "Nando" },
  { id: "B", ambienteId: "mezanino", garcom: "Lu" },
];

/** Dados de exemplo — um serviço de quarta à noite, salão quase cheio. */
export const MESAS: Mesa[] = [
  { id: 1, ambienteId: "principal", pracaId: "A", forma: "retangular", x: 11, y: 14, largura: 62, altura: 86, lugares: 4, pessoas: 4, semPedido: 23, abertaHa: 77 },
  { id: 2, ambienteId: "principal", pracaId: "A", forma: "retangular", x: 11, y: 38, largura: 62, altura: 86, lugares: 4, pessoas: 3, semPedido: 6, abertaHa: 52 },
  { id: 3, ambienteId: "principal", pracaId: "A", forma: "retangular", x: 11, y: 62, largura: 62, altura: 86, lugares: 4, pessoas: 2, semPedido: 4, abertaHa: 20 },
  { id: 4, ambienteId: "principal", pracaId: "A", forma: "retangular", x: 11, y: 86, largura: 62, altura: 86, lugares: 4, pessoas: 4, semPedido: 12, abertaHa: 64 },
  { id: 5, ambienteId: "principal", pracaId: "B", forma: "redonda", x: 29, y: 17, largura: 62, altura: 62, lugares: 4, pessoas: 0 },
  { id: 6, ambienteId: "principal", pracaId: "B", forma: "redonda", x: 43, y: 17, largura: 62, altura: 62, lugares: 4, pessoas: 0 },
  { id: 7, ambienteId: "principal", pracaId: "B", forma: "redonda", x: 57, y: 17, largura: 62, altura: 62, lugares: 4, pessoas: 0 },
  { id: 8, ambienteId: "principal", pracaId: "B", forma: "redonda", x: 29, y: 42, largura: 62, altura: 62, lugares: 4, pessoas: 0 },
  { id: 9, ambienteId: "principal", pracaId: "B", forma: "redonda", x: 43, y: 42, largura: 62, altura: 62, lugares: 4, pessoas: 2, semPedido: 38, abertaHa: 72, contaImpressa: true, total: "R$ 184,50" },
  { id: 10, ambienteId: "principal", pracaId: "B", forma: "redonda", x: 58, y: 42, largura: 76, altura: 76, lugares: 6, pessoas: 5, semPedido: 9, abertaHa: 13 },
  { id: 11, ambienteId: "principal", pracaId: "B", forma: "redonda", x: 29, y: 66, largura: 62, altura: 62, lugares: 4, pessoas: 0 },
  { id: 12, ambienteId: "principal", pracaId: "B", forma: "redonda", x: 43, y: 66, largura: 62, altura: 62, lugares: 4, pessoas: 0 },
  { id: 13, ambienteId: "principal", pracaId: "B", forma: "redonda", x: 58, y: 66, largura: 72, altura: 72, lugares: 4, pessoas: 2, semPedido: 56, abertaHa: 66 },
  { id: 14, ambienteId: "principal", pracaId: "C", forma: "retangular", x: 31, y: 89, largura: 116, altura: 54, lugares: 6, pessoas: 4, semPedido: 17, abertaHa: 26 },
  { id: 15, ambienteId: "principal", pracaId: "C", forma: "retangular", x: 53, y: 89, largura: 130, altura: 54, lugares: 8, pessoas: 8, semPedido: 11, abertaHa: 44 },
  { id: 16, ambienteId: "principal", pracaId: "D", forma: "redonda", x: 73, y: 15, largura: 56, altura: 56, lugares: 2, pessoas: 2, semPedido: 3, abertaHa: 10 },
  { id: 17, ambienteId: "principal", pracaId: "D", forma: "redonda", x: 73, y: 36, largura: 52, altura: 52, lugares: 2, pessoas: 0 },
  { id: 18, ambienteId: "principal", pracaId: "D", forma: "redonda", x: 73, y: 57, largura: 52, altura: 52, lugares: 2, pessoas: 0 },
  { id: 19, ambienteId: "principal", pracaId: "D", forma: "redonda", x: 73, y: 74, largura: 60, altura: 60, lugares: 4, pessoas: 3, semPedido: 14, abertaHa: 32 },
  { id: 20, ambienteId: "principal", pracaId: "C", forma: "redonda", x: 89, y: 89, largura: 60, altura: 60, lugares: 4, pessoas: 0 },
  { id: 21, ambienteId: "varanda", pracaId: "A", forma: "redonda", x: 16, y: 24, largura: 62, altura: 62, lugares: 4, pessoas: 4, semPedido: 8, abertaHa: 38 },
  { id: 22, ambienteId: "varanda", pracaId: "A", forma: "redonda", x: 38, y: 24, largura: 62, altura: 62, lugares: 4, pessoas: 2, semPedido: 21, abertaHa: 41 },
  { id: 23, ambienteId: "varanda", pracaId: "A", forma: "redonda", x: 60, y: 24, largura: 62, altura: 62, lugares: 4, pessoas: 0 },
  { id: 24, ambienteId: "varanda", pracaId: "A", forma: "redonda", x: 82, y: 24, largura: 62, altura: 62, lugares: 4, pessoas: 0 },
  { id: 25, ambienteId: "varanda", pracaId: "B", forma: "retangular", x: 20, y: 70, largura: 116, altura: 54, lugares: 6, pessoas: 5, semPedido: 19, abertaHa: 82 },
  { id: 26, ambienteId: "varanda", pracaId: "B", forma: "redonda", x: 50, y: 70, largura: 62, altura: 62, lugares: 2, pessoas: 2, semPedido: 5, abertaHa: 17 },
  { id: 27, ambienteId: "varanda", pracaId: "B", forma: "redonda", x: 70, y: 70, largura: 62, altura: 62, lugares: 4, pessoas: 0 },
  { id: 28, ambienteId: "varanda", pracaId: "B", forma: "redonda", x: 88, y: 70, largura: 62, altura: 62, lugares: 4, pessoas: 0 },
  { id: 29, ambienteId: "mezanino", pracaId: "A", forma: "redonda", x: 14, y: 18, largura: 56, altura: 56, lugares: 2, pessoas: 2, semPedido: 5, abertaHa: 12 },
  { id: 30, ambienteId: "mezanino", pracaId: "A", forma: "redonda", x: 32, y: 18, largura: 56, altura: 56, lugares: 2, pessoas: 0 },
  { id: 31, ambienteId: "mezanino", pracaId: "A", forma: "redonda", x: 50, y: 18, largura: 56, altura: 56, lugares: 2, pessoas: 0 },
  { id: 32, ambienteId: "mezanino", pracaId: "A", forma: "redonda", x: 68, y: 18, largura: 56, altura: 56, lugares: 2, pessoas: 0 },
  { id: 33, ambienteId: "mezanino", pracaId: "B", forma: "redonda", x: 88, y: 22, largura: 62, altura: 62, lugares: 4, pessoas: 4, semPedido: 26, abertaHa: 48 },
  { id: 34, ambienteId: "mezanino", pracaId: "B", forma: "redonda", x: 16, y: 70, largura: 62, altura: 62, lugares: 4, pessoas: 3, semPedido: 7, abertaHa: 25 },
  { id: 35, ambienteId: "mezanino", pracaId: "B", forma: "redonda", x: 40, y: 74, largura: 62, altura: 62, lugares: 4, pessoas: 4, semPedido: 10, abertaHa: 40 },
  { id: 36, ambienteId: "mezanino", pracaId: "B", forma: "retangular", x: 68, y: 76, largura: 116, altura: 54, lugares: 6, pessoas: 5, semPedido: 14, abertaHa: 30 },
  { id: 37, ambienteId: "mezanino", pracaId: "B", forma: "redonda", x: 91, y: 68, largura: 62, altura: 62, lugares: 4, pessoas: 2, semPedido: 2, abertaHa: 55, contaImpressa: true, total: "R$ 96,00" },
];

export interface Fixture {
  x: number;
  y: number;
  largura: number;
  altura: number;
  nome: string;
  solido?: boolean;
}

export const FIXTURES: Record<string, Fixture[]> = {
  principal: [
    { x: 81, y: 14, largura: 17, altura: 58, nome: "Bar" },
    { x: 16, y: -2, largura: 42, altura: 5, nome: "Cozinha", solido: true },
    { x: 66, y: 97, largura: 24, altura: 5, nome: "Entrada", solido: true },
  ],
  varanda: [{ x: 40, y: 96, largura: 30, altura: 5, nome: "Acesso ao salão", solido: true }],
  mezanino: [
    { x: 88, y: -2, largura: 12, altura: 5, nome: "Escada", solido: true },
    { x: 30, y: 97, largura: 40, altura: 5, nome: "Vista para o salão", solido: true },
  ],
};
