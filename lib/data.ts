import { gerarComandas } from "./gerar-comandas";
import type { Ambiente, Mesa, Praca, Reserva } from "./types";

export const AMBIENTES: Ambiente[] = [
  { id: "principal", nome: "Salão Principal" },
  { id: "varanda", nome: "Varanda" },
  { id: "mezanino", nome: "Mezanino" },
  { id: "eventos", nome: "Salão de Eventos" },
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
  { id: "A", ambienteId: "eventos", garcom: "Caio" },
  { id: "B", ambienteId: "eventos", garcom: "Vivi" },
  { id: "C", ambienteId: "eventos", garcom: "Hugo" },
  { id: "D", ambienteId: "eventos", garcom: "Maya" },
];

/**
 * Recurso de posições (US 24360), opcional por estabelecimento. Desligado, a mesa funciona sem
 * posições; o Salão de Eventos fica desligado para exercitar esse caminho.
 */
export const POSICOES_HABILITADAS: Record<string, boolean> = {
  principal: true,
  varanda: true,
  mezanino: true,
  eventos: false,
};

export function posicoesHabilitadas(ambienteId: string): boolean {
  return POSICOES_HABILITADAS[ambienteId] ?? false;
}

/** Instante dos dados: 21h10 de uma quarta. As reservas são relativas a ele. */
const AGORA = 21 * 60 + 10;

function reserva(emMinutos: number, nome: string, pessoas: number): Reserva {
  const t = AGORA + emMinutos;
  const hora = `${String(Math.floor(t / 60) % 24).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
  return { hora, nome, pessoas, emMinutos };
}

/** Dados de exemplo — um serviço de quarta à noite, salão quase cheio. */
const MESAS_BASE: Mesa[] = [
  { id: 1, ambienteId: "principal", pracaId: "A", forma: "retangular", x: 11, y: 14, largura: 62, altura: 86, lugares: 4, pessoas: 4, semPedido: 23, abertaHa: 77, pedidosPendentes: 1, pendenteHa: 26, total: 318 },
  { id: 2, ambienteId: "principal", pracaId: "A", forma: "retangular", x: 11, y: 38, largura: 62, altura: 86, lugares: 4, pessoas: 3, semPedido: 6, abertaHa: 52, pedidosPendentes: 2, pendenteHa: 8, total: 241.5 },
  { id: 3, ambienteId: "principal", pracaId: "A", forma: "retangular", x: 11, y: 62, largura: 62, altura: 86, lugares: 4, pessoas: 2, semPedido: 4, abertaHa: 20, total: 96 },
  { id: 4, ambienteId: "principal", pracaId: "A", forma: "retangular", x: 11, y: 86, largura: 62, altura: 86, lugares: 4, pessoas: 4, semPedido: 12, abertaHa: 64, pedidosPendentes: 1, pendenteHa: 17, total: 287 },
  { id: 5, ambienteId: "principal", pracaId: "B", forma: "redonda", x: 29, y: 17, largura: 62, altura: 62, lugares: 4, pessoas: 0, livreHa: 12 },
  { id: 6, ambienteId: "principal", pracaId: "B", forma: "redonda", x: 43, y: 17, largura: 62, altura: 62, lugares: 4, pessoas: 0, livreHa: 4, reserva: reserva(15, "Fernanda Lima", 4) },
  { id: 7, ambienteId: "principal", pracaId: "B", forma: "redonda", x: 57, y: 17, largura: 62, altura: 62, lugares: 4, pessoas: 0, livreHa: 45, reserva: reserva(80, "Carvalho", 6) },
  { id: 8, ambienteId: "principal", pracaId: "B", forma: "redonda", x: 29, y: 42, largura: 62, altura: 62, lugares: 4, pessoas: 0, livreHa: 5 },
  { id: 9, ambienteId: "principal", pracaId: "B", forma: "redonda", x: 43, y: 42, largura: 62, altura: 62, lugares: 4, pessoas: 2, semPedido: 38, abertaHa: 72, contaImpressa: true, contaImpressaHa: 14, total: 184.5 },
  { id: 10, ambienteId: "principal", pracaId: "B", forma: "redonda", x: 58, y: 42, largura: 76, altura: 76, lugares: 6, pessoas: 5, semPedido: 9, abertaHa: 13, pedidosPendentes: 1, pendenteHa: 9, total: 164 },
  { id: 11, ambienteId: "principal", pracaId: "B", forma: "redonda", x: 29, y: 66, largura: 62, altura: 62, lugares: 4, pessoas: 0, livreHa: 20, reserva: reserva(8, "Rocha", 2) },
  { id: 12, ambienteId: "principal", pracaId: "B", forma: "redonda", x: 43, y: 66, largura: 62, altura: 62, lugares: 4, pessoas: 0, livreHa: 28 },
  { id: 13, ambienteId: "principal", pracaId: "B", forma: "redonda", x: 58, y: 66, largura: 72, altura: 72, lugares: 4, pessoas: 2, semPedido: 56, abertaHa: 66, pedidosPendentes: 1, pendenteHa: 61, total: 129 },
  { id: 14, ambienteId: "principal", pracaId: "C", forma: "retangular", x: 31, y: 89, largura: 116, altura: 54, lugares: 6, pessoas: 4, semPedido: 21, abertaHa: 41, total: 274 },
  { id: 15, ambienteId: "principal", pracaId: "C", forma: "retangular", x: 53, y: 89, largura: 130, altura: 54, lugares: 8, pessoas: 8, semPedido: 11, abertaHa: 44, pedidosPendentes: 3, pendenteHa: 16, total: 612 },
  { id: 16, ambienteId: "principal", pracaId: "D", forma: "redonda", x: 73, y: 15, largura: 56, altura: 56, lugares: 2, pessoas: 2, semPedido: 3, abertaHa: 10, total: 58 },
  { id: 17, ambienteId: "principal", pracaId: "D", forma: "redonda", x: 73, y: 36, largura: 52, altura: 52, lugares: 2, pessoas: 0, livreHa: 3 },
  { id: 18, ambienteId: "principal", pracaId: "D", forma: "redonda", x: 73, y: 57, largura: 52, altura: 52, lugares: 2, pessoas: 0, livreHa: 9, reserva: reserva(25, "Silva", 2) },
  { id: 19, ambienteId: "principal", pracaId: "D", forma: "redonda", x: 73, y: 74, largura: 60, altura: 60, lugares: 4, pessoas: 3, semPedido: 14, abertaHa: 32, pedidosPendentes: 1, pendenteHa: 14, total: 147 },
  { id: 20, ambienteId: "principal", pracaId: "C", forma: "redonda", x: 89, y: 89, largura: 60, altura: 60, lugares: 4, pessoas: 0, livreHa: 33 },
  { id: 21, ambienteId: "varanda", pracaId: "A", forma: "redonda", x: 16, y: 24, largura: 62, altura: 62, lugares: 4, pessoas: 4, semPedido: 8, abertaHa: 38, total: 226 },
  { id: 22, ambienteId: "varanda", pracaId: "A", forma: "redonda", x: 38, y: 24, largura: 62, altura: 62, lugares: 4, pessoas: 2, semPedido: 21, abertaHa: 41, pedidosPendentes: 2, pendenteHa: 24, total: 112 },
  { id: 23, ambienteId: "varanda", pracaId: "A", forma: "redonda", x: 60, y: 24, largura: 62, altura: 62, lugares: 4, pessoas: 0, livreHa: 15, reserva: reserva(20, "Almeida", 4) },
  { id: 24, ambienteId: "varanda", pracaId: "A", forma: "redonda", x: 82, y: 24, largura: 62, altura: 62, lugares: 4, pessoas: 0, livreHa: 9, reserva: reserva(95, "Barros", 4) },
  { id: 25, ambienteId: "varanda", pracaId: "B", forma: "retangular", x: 20, y: 70, largura: 116, altura: 54, lugares: 6, pessoas: 5, semPedido: 19, abertaHa: 82, pedidosPendentes: 1, pendenteHa: 19, total: 436 },
  { id: 26, ambienteId: "varanda", pracaId: "B", forma: "redonda", x: 50, y: 70, largura: 62, altura: 62, lugares: 2, pessoas: 2, semPedido: 5, abertaHa: 17, total: 74 },
  { id: 27, ambienteId: "varanda", pracaId: "B", forma: "redonda", x: 70, y: 70, largura: 62, altura: 62, lugares: 4, pessoas: 0, livreHa: 22 },
  { id: 28, ambienteId: "varanda", pracaId: "B", forma: "redonda", x: 88, y: 70, largura: 62, altura: 62, lugares: 4, pessoas: 0, livreHa: 6, reserva: reserva(10, "Moura", 3) },
  { id: 29, ambienteId: "mezanino", pracaId: "A", forma: "redonda", x: 14, y: 18, largura: 56, altura: 56, lugares: 2, pessoas: 2, semPedido: 5, abertaHa: 12, total: 42 },
  { id: 30, ambienteId: "mezanino", pracaId: "A", forma: "redonda", x: 32, y: 18, largura: 56, altura: 56, lugares: 2, pessoas: 0, livreHa: 18 },
  { id: 31, ambienteId: "mezanino", pracaId: "A", forma: "redonda", x: 50, y: 18, largura: 56, altura: 56, lugares: 2, pessoas: 0, livreHa: 7, reserva: reserva(28, "Teixeira", 2) },
  { id: 32, ambienteId: "mezanino", pracaId: "A", forma: "redonda", x: 68, y: 18, largura: 56, altura: 56, lugares: 2, pessoas: 0, livreHa: 40 },
  { id: 33, ambienteId: "mezanino", pracaId: "B", forma: "redonda", x: 88, y: 22, largura: 62, altura: 62, lugares: 4, pessoas: 4, semPedido: 26, abertaHa: 48, total: 198 },
  { id: 34, ambienteId: "mezanino", pracaId: "B", forma: "redonda", x: 16, y: 70, largura: 62, altura: 62, lugares: 4, pessoas: 3, semPedido: 6, abertaHa: 25, pedidosPendentes: 1, pendenteHa: 6, total: 133 },
  { id: 35, ambienteId: "mezanino", pracaId: "B", forma: "redonda", x: 40, y: 74, largura: 62, altura: 62, lugares: 4, pessoas: 4, semPedido: 10, abertaHa: 40, total: 251 },
  { id: 36, ambienteId: "mezanino", pracaId: "B", forma: "retangular", x: 68, y: 76, largura: 116, altura: 54, lugares: 6, pessoas: 5, semPedido: 14, abertaHa: 30, total: 289 },
  { id: 37, ambienteId: "mezanino", pracaId: "B", forma: "redonda", x: 91, y: 68, largura: 62, altura: 62, lugares: 4, pessoas: 2, semPedido: 2, abertaHa: 55, contaImpressa: true, contaImpressaHa: 3, total: 96 },
];

/*
  Salão de Eventos: grade de mesas de banquete gerada aqui, com LCG semeado para
  o salão ser idêntico a cada carga (Math.random quebraria a hidratação).
  Posições em metros no campo de mesas e depois convertidas em % do ambiente;
  as medidas do campo precisam bater com `CENARIOS.eventos`.
*/
const EV_COLUNAS = 12;
const EV_LINHAS = 10;
const EV_PASSO_X = 3.6;
const EV_PASSO_Z = 3.1;
const EV_CORREDOR_X = 1.8;
const EV_CORREDOR_Z = 2;
export const EV_CAMPO_L = EV_COLUNAS * EV_PASSO_X + 2 * EV_CORREDOR_X;
export const EV_CAMPO_P = EV_LINHAS * EV_PASSO_Z + EV_CORREDOR_Z;

const NOMES = ["Moreira", "Pacheco", "Duarte", "Nogueira", "Campos", "Ferraz", "Lopes", "Menezes"];

function gerarEventos(): Mesa[] {
  let semente = 20260720;
  const sorteio = () => {
    semente = (Math.imul(semente, 1664525) + 1013904223) >>> 0;
    return semente / 4294967296;
  };
  const inteiro = (min: number, max: number) => min + Math.floor(sorteio() * (max - min + 1));

  const mesas: Mesa[] = [];
  for (let l = 0; l < EV_LINHAS; l++) {
    for (let c = 0; c < EV_COLUNAS; c++) {
      const xm = EV_PASSO_X / 2 + c * EV_PASSO_X + Math.floor(c / 4) * EV_CORREDOR_X;
      const zm = EV_PASSO_Z / 2 + l * EV_PASSO_Z + (l >= EV_LINHAS / 2 ? EV_CORREDOR_Z : 0);
      const redonda = (c + l) % 3 !== 0;
      const lugares = redonda ? 8 : 10;

      const r = sorteio();
      const mesa: Mesa = {
        id: 100 + l * EV_COLUNAS + c,
        ambienteId: "eventos",
        pracaId: "ABCD"[Math.floor(c / 3)],
        forma: redonda ? "redonda" : "retangular",
        x: Math.round((xm / EV_CAMPO_L) * 1000) / 10,
        y: Math.round((zm / EV_CAMPO_P) * 1000) / 10,
        largura: redonda ? 120 : 220,
        altura: redonda ? 120 : 64,
        lugares,
        pessoas: 0,
      };

      if (r >= 0.29) {
        mesa.pessoas = inteiro(Math.ceil(lugares / 2), lugares);
        mesa.abertaHa = inteiro(8, 95);
        mesa.semPedido = inteiro(2, 17);
        if (r >= 0.9 && r < 0.95) mesa.semPedido = inteiro(20, 38);
        else if (r >= 0.95 && r < 0.97) mesa.semPedido = inteiro(41, 70);
        else if (r >= 0.97) {
          mesa.contaImpressa = true;
          mesa.contaImpressaHa = inteiro(1, 25);
        }
        // O último pedido não pode ser anterior à abertura da comanda.
        mesa.abertaHa = Math.max(mesa.abertaHa, mesa.semPedido);
        mesa.total = mesa.pessoas * inteiro(55, 190);
        if (sorteio() < 0.25) {
          mesa.pedidosPendentes = inteiro(1, 3);
          // O item mais antigo foi lançado no último pedido ou antes dele.
          mesa.pendenteHa = Math.min(mesa.abertaHa, mesa.semPedido + inteiro(0, 6));
        }
      } else {
        mesa.livreHa = inteiro(2, 90);
        const proxima = sorteio();
        const nome = NOMES[inteiro(0, NOMES.length - 1)];
        if (proxima < 0.16) mesa.reserva = reserva(inteiro(4, 29), nome, inteiro(2, lugares));
        else if (proxima < 0.24) mesa.reserva = reserva(inteiro(40, 150), nome, inteiro(2, lugares));
      }
      mesas.push(mesa);
    }
  }
  return mesas;
}

/** Mesas com nome dado na abertura, como no PDV ("1 - CAIO VI…"). */
const NOMES_DE_MESA: Record<number, string> = {
  15: "Aniversário Carla",
  25: "Despedida do Caio",
  36: "Equipe Comercial",
};

/** Mesas com mais de uma comanda aberta (o PDV mostra "3 comandas"). */
const COMANDAS_POR_MESA: Record<number, number> = { 15: 3, 25: 3, 1: 2, 14: 2, 36: 2, 10: 2, 35: 2, 21: 2 };

/** Aberta antes de ativar o recurso: fica com comandas, mas sem posições. */
const SEM_POSICOES = new Set([33]);

function comComandas(mesa: Mesa): Mesa {
  const garcom = PRACAS.find((p) => p.id === mesa.pracaId && p.ambienteId === mesa.ambienteId)?.garcom ?? "Caixa";
  // Nas mesas de evento a quantidade de comandas sai do id, para não consumir o sorteio do gerador.
  const evento = mesa.ambienteId === "eventos";
  return gerarComandas(mesa, {
    garcom,
    comPosicoes: posicoesHabilitadas(mesa.ambienteId) && !SEM_POSICOES.has(mesa.id),
    nome: NOMES_DE_MESA[mesa.id],
    comandas: COMANDAS_POR_MESA[mesa.id] ?? (evento && mesa.id % 5 === 0 ? 2 : 1),
  });
}

export const MESAS: Mesa[] = [...MESAS_BASE, ...gerarEventos()].map(comComandas);

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
  eventos: [
    { x: 50, y: -8, largura: 38, altura: 6, nome: "Palco", solido: true },
    { x: -6, y: 50, largura: 5, altura: 70, nome: "Buffet" },
  ],
  mezanino: [
    { x: 88, y: -2, largura: 12, altura: 5, nome: "Escada", solido: true },
    { x: 30, y: 97, largura: 40, altura: 5, nome: "Vista para o salão", solido: true },
  ],
};
