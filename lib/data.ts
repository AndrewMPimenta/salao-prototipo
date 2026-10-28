import { gerarComandas } from "./gerar-comandas";
import type { Ambiente, Mesa, Praca, Reserva } from "./types";

export const AMBIENTES: Ambiente[] = [
  { id: "terraco", nome: "Restaurante do Terraço", ilustrativo: true },
  { id: "hotbeach", nome: "Hot Beach Celebration", ilustrativo: true },
  { id: "hotbeach-suites", nome: "Hot Beach Suites", ilustrativo: true },
  { id: "hotbeach-resort", nome: "Hot Beach Resort", ilustrativo: true },
  { id: "principal", nome: "Salão Principal" },
  { id: "varanda", nome: "Varanda" },
  { id: "mezanino", nome: "Mezanino" },
  { id: "eventos", nome: "Salão de Eventos" },
];

export const PRACAS: Praca[] = [
  { id: "A", ambienteId: "terraco", garcom: "Mari" },
  { id: "B", ambienteId: "terraco", garcom: "Gui" },
  { id: "C", ambienteId: "terraco", garcom: "Ana" },
  { id: "A", ambienteId: "hotbeach", garcom: "Duda" },
  { id: "B", ambienteId: "hotbeach", garcom: "Kauê" },
  { id: "C", ambienteId: "hotbeach", garcom: "Lari" },
  { id: "D", ambienteId: "hotbeach", garcom: "Theo" },
  { id: "A", ambienteId: "hotbeach-suites", garcom: "Patrícia" },
  { id: "B", ambienteId: "hotbeach-suites", garcom: "Rogério" },
  { id: "C", ambienteId: "hotbeach-suites", garcom: "Vanessa" },
  { id: "D", ambienteId: "hotbeach-suites", garcom: "Anderson" },
  { id: "A", ambienteId: "hotbeach-resort", garcom: "Cíntia" },
  { id: "B", ambienteId: "hotbeach-resort", garcom: "Edson" },
  { id: "C", ambienteId: "hotbeach-resort", garcom: "Luana" },
  { id: "D", ambienteId: "hotbeach-resort", garcom: "Marcelo" },
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
  terraco: true,
  hotbeach: false,
  "hotbeach-suites": false,
  "hotbeach-resort": false,
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
  const evento = ["eventos", "hotbeach", "hotbeach-suites", "hotbeach-resort"].includes(mesa.ambienteId);
  return gerarComandas(mesa, {
    garcom,
    comPosicoes: posicoesHabilitadas(mesa.ambienteId) && !SEM_POSICOES.has(mesa.id),
    nome: NOMES_DE_MESA[mesa.id],
    comandas: COMANDAS_POR_MESA[mesa.id] ?? (evento && mesa.id % 5 === 0 ? 2 : 1),
  });
}

/*
  Terraço e Hot Beach: mesmas regras do gerador de eventos (LCG semeado, metros no campo e depois
  % do ambiente), mas a grade vem de células explícitas. O espaçamento garante pegada da mesa com
  cadeiras mais 0,9 m de corredor; as medidas do campo precisam bater com `CENARIOS`.
*/
interface Celula {
  xm: number;
  zm: number;
  forma: Mesa["forma"];
  largura: number;
  altura: number;
  lugares: number;
  pracaId: string;
}

interface ParamsSalao {
  semente: number;
  ambienteId: string;
  idInicial: number;
  campoL: number;
  campoP: number;
  /** Fração de mesas abertas; o sorteio acima de 0,9 vira alerta (~10% do total). */
  ocupacao: number;
  reservadas: number;
  celulas: Celula[];
}

function gerarSalao(p: ParamsSalao): Mesa[] {
  let semente = p.semente;
  const sorteio = () => {
    semente = (Math.imul(semente, 1664525) + 1013904223) >>> 0;
    return semente / 4294967296;
  };
  const inteiro = (min: number, max: number) => min + Math.floor(sorteio() * (max - min + 1));

  const mesas = p.celulas.map((cel, i): Mesa => {
    const r = sorteio();
    const mesa: Mesa = {
      id: p.idInicial + i,
      ambienteId: p.ambienteId,
      pracaId: cel.pracaId,
      forma: cel.forma,
      x: Math.round((cel.xm / p.campoL) * 1000) / 10,
      y: Math.round((cel.zm / p.campoP) * 1000) / 10,
      largura: cel.largura,
      altura: cel.altura,
      lugares: cel.lugares,
      pessoas: 0,
    };

    if (r >= 1 - p.ocupacao) {
      mesa.pessoas = inteiro(Math.ceil(cel.lugares / 2), cel.lugares);
      mesa.abertaHa = inteiro(8, 95);
      mesa.semPedido = inteiro(2, 17);
      if (r >= 0.9 && r < 0.95) mesa.semPedido = inteiro(20, 38);
      else if (r >= 0.95 && r < 0.97) mesa.semPedido = inteiro(41, 70);
      else if (r >= 0.97) {
        mesa.contaImpressa = true;
        mesa.contaImpressaHa = inteiro(1, 25);
      }
      mesa.abertaHa = Math.max(mesa.abertaHa, mesa.semPedido);
      mesa.total = mesa.pessoas * inteiro(55, 190);
      if (sorteio() < 0.25) {
        mesa.pedidosPendentes = inteiro(1, 3);
        mesa.pendenteHa = Math.min(mesa.abertaHa, mesa.semPedido + inteiro(0, 6));
      }
    } else {
      mesa.livreHa = inteiro(2, 90);
    }
    return mesa;
  });

  // Reservas por contagem fixa, não por probabilidade: o cenário pede 2–3 mesas reservadas.
  const livres = mesas.filter((m) => m.pessoas === 0);
  const passo = Math.max(1, Math.floor(livres.length / p.reservadas));
  for (let k = 0; k < p.reservadas && k * passo < livres.length; k++) {
    const m = livres[k * passo];
    m.reserva = reserva(inteiro(4, 29), NOMES[inteiro(0, NOMES.length - 1)], inteiro(2, m.lugares));
  }
  return mesas;
}

/*
  Terraço: 10 colunas x 5 linhas, uma célula livre (passagem do bar). A linha do guarda-corpo
  (sul) é de mesas de 2 lugares; três retangulares de 6.
*/
const TE_COLUNAS = 10;
const TE_LINHAS = 5;
const TE_PASSO_X = 2.6;
const TE_PASSO_Z = 2.3;
const TE_CORREDOR_X = 0.8;
export const TE_CAMPO_L = TE_COLUNAS * TE_PASSO_X + TE_CORREDOR_X;
export const TE_CAMPO_P = TE_LINHAS * TE_PASSO_Z;

const TE_RETANGULARES = new Set(["1,1", "1,8", "3,4"]);

export function celulasTerraco(): Celula[] {
  const celulas: Celula[] = [];
  for (let l = 0; l < TE_LINHAS; l++) {
    for (let c = 0; c < TE_COLUNAS; c++) {
      if (l === 2 && c === 5) continue;
      const retangular = TE_RETANGULARES.has(`${l},${c}`);
      const dois = !retangular && (l === TE_LINHAS - 1 || (c + l) % 3 === 0);
      celulas.push({
        xm: TE_PASSO_X / 2 + c * TE_PASSO_X + (c >= 5 ? TE_CORREDOR_X : 0),
        zm: TE_PASSO_Z / 2 + l * TE_PASSO_Z,
        forma: retangular ? "retangular" : "redonda",
        largura: retangular ? 116 : dois ? 52 : 62,
        altura: retangular ? 54 : dois ? 52 : 62,
        lugares: retangular ? 6 : dois ? 2 : 4,
        pracaId: "ABC"[c < 3 ? 0 : c < 7 ? 1 : 2],
      });
    }
  }
  return celulas;
}

/*
  Hot Beach: grade 11 x 8 de mesas redondas de 6 e 8 lugares em volta do buffet (5 x 3 células
  centrais), com o canto sudeste e a frente norte livres e uma célula a menos no
  canto sudoeste: 88 - 15 - 4 - 3 - 1 = 65.
*/
const HB_COLUNAS = 11;
const HB_LINHAS = 8;
const HB_PASSO = 3;
export const HB_CAMPO_L = HB_COLUNAS * HB_PASSO;
export const HB_CAMPO_P = HB_LINHAS * HB_PASSO;

export function celulasHotBeach(): Celula[] {
  const celulas: Celula[] = [];
  for (let l = 0; l < HB_LINHAS; l++) {
    for (let c = 0; c < HB_COLUNAS; c++) {
      const buffet = c >= 3 && c <= 7 && l >= 2 && l <= 4;
      const canto = c >= 9 && l >= 6;
      const frente = l === 0 && c >= 4 && c <= 6;
      if (buffet || canto || frente || (l === 7 && c === 0)) continue;
      const oito = (c + l) % 2 === 0;
      celulas.push({
        xm: HB_PASSO / 2 + c * HB_PASSO,
        zm: HB_PASSO / 2 + l * HB_PASSO,
        forma: "redonda",
        largura: oito ? 116 : 100,
        altura: oito ? 116 : 100,
        lugares: oito ? 8 : 6,
        pracaId: "ABCD"[Math.min(3, Math.floor(c / 2.75))],
      });
    }
  }
  return celulas;
}

/*
  Hot Beach Suites e Resort: o campo é a união de zonas de grade, cada uma com seu tipo de mesa e
  seu passo. O passo é a pegada da mesa com cadeiras (o desenho de `posicoesCadeiras`) mais 0,9 m
  de corredor; entre as zonas ficam corredores largos. As medidas do campo precisam bater com `CENARIOS`.
*/
type TipoMesa = Pick<Celula, "forma" | "largura" | "altura" | "lugares">;

const REDONDA_4: TipoMesa = { forma: "redonda", largura: 80, altura: 80, lugares: 4 };
const REDONDA_6: TipoMesa = { forma: "redonda", largura: 100, altura: 100, lugares: 6 };
const RETANGULAR_6: TipoMesa = { forma: "retangular", largura: 116, altura: 54, lugares: 6 };
const RETANGULAR_8: TipoMesa = { forma: "retangular", largura: 150, altura: 62, lugares: 8 };

interface Zona {
  x0: number;
  z0: number;
  colunas: number;
  linhas: number;
  passoX: number;
  passoZ: number;
  tipo: (coluna: number, linha: number) => TipoMesa;
}

/** Uma praça por quadrante do campo, para cada garçom ficar com uma região contínua. */
function celulasDeZonas(zonas: Zona[], campoL: number, campoP: number): Celula[] {
  const celulas: Celula[] = [];
  for (const z of zonas) {
    for (let l = 0; l < z.linhas; l++) {
      for (let c = 0; c < z.colunas; c++) {
        const xm = z.x0 + z.passoX / 2 + c * z.passoX;
        const zm = z.z0 + z.passoZ / 2 + l * z.passoZ;
        celulas.push({ xm, zm, ...z.tipo(c, l), pracaId: "ABCD"[(zm >= campoP / 2 ? 2 : 0) + (xm >= campoL / 2 ? 1 : 0)] });
      }
    }
  }
  return celulas;
}

/*
  Suites: restaurante de buffet. Corredor vertical de ~5 m entre oeste e leste, faixa central para
  a ilha do buffet, e um pequeno bolsão de retangulares de 8 a oeste da faixa:
  32 + 28 + 6 + 30 + 28 = 124.
*/
export const SU_CAMPO_L = 42.5;
export const SU_CAMPO_P = 31;

export function celulasSuites(): Celula[] {
  return celulasDeZonas(
    [
      { x0: 0, z0: 0, colunas: 8, linhas: 4, passoX: 2.4, passoZ: 2.4, tipo: () => REDONDA_4 },
      { x0: 23.5, z0: 0, colunas: 7, linhas: 4, passoX: 2.65, passoZ: 2.65, tipo: () => REDONDA_6 },
      { x0: 0, z0: 12.35, colunas: 2, linhas: 3, passoX: 3.1, passoZ: 2.1, tipo: () => RETANGULAR_8 },
      { x0: 0, z0: 20, colunas: 6, linhas: 5, passoX: 3.1, passoZ: 2.1, tipo: () => RETANGULAR_8 },
      { x0: 23.5, z0: 19.9, colunas: 7, linhas: 4, passoX: 2.65, passoZ: 2.65, tipo: (_, l) => (l % 2 === 0 ? REDONDA_4 : REDONDA_6) },
    ],
    SU_CAMPO_L,
    SU_CAMPO_P,
  );
}

/*
  Resort: três faixas de deck separadas por corredores de ~3,5 m (o do leste é o da entrada):
  mesas de 4 junto à piscina, de 6 no centro e retangulares de 6 junto ao buffet:
  32 + 28 + 45 = 105.
*/
export const RE_CAMPO_L = 38.5;
export const RE_CAMPO_P = 19.2;

export function celulasResort(): Celula[] {
  return celulasDeZonas(
    [
      { x0: 0, z0: 0, colunas: 4, linhas: 8, passoX: 2.4, passoZ: 2.4, tipo: () => REDONDA_4 },
      { x0: 12.2, z0: 0.325, colunas: 4, linhas: 7, passoX: 2.65, passoZ: 2.65, tipo: () => REDONDA_6 },
      { x0: 25.4, z0: 0.15, colunas: 5, linhas: 9, passoX: 2.6, passoZ: 2.1, tipo: () => RETANGULAR_6 },
    ],
    RE_CAMPO_L,
    RE_CAMPO_P,
  );
}

const MESAS_TERRACO = gerarSalao({
  semente: 202608041,
  ambienteId: "terraco",
  idInicial: 300,
  campoL: TE_CAMPO_L,
  campoP: TE_CAMPO_P,
  ocupacao: 0.6,
  reservadas: 3,
  celulas: celulasTerraco(),
});

const MESAS_HOTBEACH = gerarSalao({
  semente: 20260944,
  ambienteId: "hotbeach",
  idInicial: 400,
  campoL: HB_CAMPO_L,
  campoP: HB_CAMPO_P,
  ocupacao: 0.7,
  reservadas: 5,
  celulas: celulasHotBeach(),
});

const MESAS_SUITES = gerarSalao({
  semente: 20262006,
  ambienteId: "hotbeach-suites",
  idInicial: 500,
  campoL: SU_CAMPO_L,
  campoP: SU_CAMPO_P,
  ocupacao: 0.62,
  reservadas: 5,
  celulas: celulasSuites(),
});

const MESAS_RESORT = gerarSalao({
  semente: 20262010,
  ambienteId: "hotbeach-resort",
  idInicial: 700,
  campoL: RE_CAMPO_L,
  campoP: RE_CAMPO_P,
  ocupacao: 0.68,
  reservadas: 5,
  celulas: celulasResort(),
});

export const MESAS: Mesa[] = [...MESAS_TERRACO, ...MESAS_HOTBEACH, ...MESAS_SUITES, ...MESAS_RESORT, ...MESAS_BASE, ...gerarEventos()].map(comComandas);

export interface Fixture {
  x: number;
  y: number;
  largura: number;
  altura: number;
  nome: string;
  solido?: boolean;
}

export const FIXTURES: Record<string, Fixture[]> = {
  terraco: [
    { x: 4, y: -3, largura: 22, altura: 7, nome: "Bar", solido: true },
    { x: 86, y: -3, largura: 12, altura: 7, nome: "Entrada", solido: true },
    { x: 0, y: 97, largura: 100, altura: 4, nome: "Varanda de vidro", solido: true },
  ],
  hotbeach: [
    { x: 33.3, y: 40.6, largura: 33.3, altura: 6.3, nome: "Buffet", solido: true },
    { x: -20.6, y: 6.3, largura: 17, altura: 87.5, nome: "Piscina" },
    { x: -18.8, y: -15.6, largura: 13.3, altura: 4.2, nome: "Bar da piscina", solido: true },
    { x: 44.8, y: -33.3, largura: 10.3, altura: 5, nome: "Entrada", solido: true },
  ],
  "hotbeach-suites": [
    { x: 25.9, y: 45.2, largura: 51.8, altura: 6.5, nome: "Buffet", solido: true },
    { x: 108.4, y: 24.2, largura: 2.8, altura: 51.6, nome: "Bar", solido: true },
    { x: 39.4, y: 102.6, largura: 21.2, altura: 12.9, nome: "Entrada" },
  ],
  "hotbeach-resort": [
    { x: -18.2, y: 2.3, largura: 14, altura: 93.7, nome: "Piscina" },
    { x: -16.9, y: -18, largura: 11.4, altura: 5.2, nome: "Bar da piscina", solido: true },
    { x: 108.2, y: 23.2, largura: 4.2, altura: 50, nome: "Buffet", solido: true },
    { x: 58.2, y: -28.6, largura: 8.8, altura: 6.3, nome: "Entrada", solido: true },
    { x: 0, y: 101, largura: 100, altura: 4, nome: "Deck" },
  ],
  principal: [
    { x: 81, y: 14, largura: 17, altura: 58, nome: "Bar" },
    { x: 16, y: -2, largura: 42, altura: 5, nome: "Cozinha", solido: true },
    { x: 66, y: 97, largura: 24, altura: 5, nome: "Entrada", solido: true },
    { x: 100.5, y: 22, largura: 5, altura: 14, nome: "Banheiros", solido: true },
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
