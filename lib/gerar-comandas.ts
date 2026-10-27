import type { Comanda, ItemPedido, Mesa, Posicao } from "./types";

type TipoItem = "bebida" | "prato" | "porcao" | "sobremesa";

interface ItemCardapio {
  nome: string;
  preco: number;
  tipo: TipoItem;
}

/** `porcao` é o que a mesa divide: vira item compartilhado quando há posições. */
const CARDAPIO: ItemCardapio[] = [
  { nome: "Chopp pilsen 500 ml", preco: 18.9, tipo: "bebida" },
  { nome: "Caipirinha de limão", preco: 24, tipo: "bebida" },
  { nome: "Água com gás", preco: 8.5, tipo: "bebida" },
  { nome: "Refrigerante lata", preco: 9, tipo: "bebida" },
  { nome: "Suco de laranja", preco: 13, tipo: "bebida" },
  { nome: "Taça de vinho tinto", preco: 32, tipo: "bebida" },
  { nome: "Long neck", preco: 14, tipo: "bebida" },
  { nome: "Gin tônica", preco: 34, tipo: "bebida" },
  { nome: "Risoto de funghi", preco: 62, tipo: "prato" },
  { nome: "Salmão grelhado", preco: 78, tipo: "prato" },
  { nome: "Filé à parmegiana", preco: 69, tipo: "prato" },
  { nome: "Hambúrguer artesanal", preco: 48, tipo: "prato" },
  { nome: "Massa ao pesto", preco: 54, tipo: "prato" },
  { nome: "Porção de fritas", preco: 38, tipo: "porcao" },
  { nome: "Isca de peixe", preco: 56, tipo: "porcao" },
  { nome: "Bolinho de bacalhau", preco: 44, tipo: "porcao" },
  { nome: "Picanha na chapa", preco: 139, tipo: "porcao" },
  { nome: "Garrafa de vinho tinto", preco: 169, tipo: "porcao" },
  { nome: "Petit gâteau", preco: 32, tipo: "sobremesa" },
  { nome: "Pudim de leite", preco: 18, tipo: "sobremesa" },
  { nome: "Café expresso", preco: 7, tipo: "sobremesa" },
];

const PRIMEIROS_NOMES = ["Carla", "Caio", "Marina", "Bruno", "Helena", "Paulo", "Júlia", "Renato", "Aline", "Tiago"];

/** LCG semeado por mesa: `Math.random` quebraria a hidratação e mudaria o salão a cada carga. */
function criarSorteio(semente: number) {
  let s = semente >>> 0;
  const proximo = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const inteiro = (min: number, max: number) => min + Math.floor(proximo() * (max - min + 1));
  const sortear = <T,>(lista: T[]): T => lista[Math.floor(proximo() * lista.length)];
  return { proximo, inteiro, sortear };
}

type Sorteio = ReturnType<typeof criarSorteio>;

function escolherTipo(progresso: number, abertaHa: number, r: Sorteio): TipoItem {
  const x = r.proximo();
  if (progresso < 0.25) return x < 0.7 ? "bebida" : "porcao";
  if (progresso < 0.8) return x < 0.45 ? "prato" : x < 0.8 ? "bebida" : "porcao";
  return abertaHa > 40 && x < 0.6 ? "sobremesa" : "bebida";
}

interface Linha {
  produto: ItemCardapio;
  qtd: number;
}

/** Sequência cronológica do que a mesa pediu, parando perto do consumo já registrado na mesa. */
function sequenciaDeItens(mesa: Mesa, minimo: number, qtdLivre: boolean, r: Sorteio): Linha[] {
  const alvo = mesa.total ?? 0;
  const linhas: Linha[] = [];
  let soma = 0;

  while (soma < alvo || linhas.length < minimo) {
    const restante = alvo - soma;
    const tipo = escolherTipo(alvo > 0 ? soma / alvo : 1, mesa.abertaHa ?? 0, r);

    let candidatos = CARDAPIO.filter((c) => c.tipo === tipo && c.preco <= restante * 1.1 + 5);
    if (candidatos.length === 0) candidatos = CARDAPIO.filter((c) => c.preco <= 14);

    const produto = r.sortear(candidatos);
    // Sem posições o garçom lança "3 chopps" numa linha só.
    const qtd = produto.tipo === "bebida" ? (qtdLivre ? r.inteiro(1, 3) : r.proximo() < 0.12 ? 2 : 1) : 1;
    linhas.push({ produto, qtd });
    soma += produto.preco * qtd;
  }

  // O último item que estoura o alvo só fica se deixar a soma mais perto dele.
  if (linhas.length > minimo) {
    const ultima = linhas[linhas.length - 1];
    const valor = ultima.produto.preco * ultima.qtd;
    if (Math.abs(soma - valor - alvo) < Math.abs(soma - alvo)) linhas.pop();
  }
  return linhas;
}

/** Instantes (minutos atrás) em ordem cronológica, respeitando último pedido e pendente mais antigo da mesa. */
function instantes(n: number, pendentes: number, aberta: number, ultimo: number, pendenteHa: number | undefined, r: Sorteio) {
  const t = new Array<number>(n).fill(ultimo);
  const preencher = (de: number, ate: number, alto: number, baixo: number) => {
    const valores: number[] = [];
    for (let i = de + 1; i < ate; i++) valores.push(r.inteiro(Math.min(baixo, alto), alto));
    valores.sort((a, b) => b - a);
    valores.forEach((v, i) => (t[de + 1 + i] = v));
  };

  t[0] = aberta;
  t[n - 1] = ultimo;

  if (pendentes === 0) {
    preencher(0, n - 1, aberta, ultimo);
    return { t, primeiroPendente: n, fimPendente: n };
  }

  const antigo = Math.min(aberta, Math.max(ultimo, pendenteHa ?? ultimo));
  // Se o pendente mais antigo é anterior ao último pedido, o último item já foi entregue.
  const m = n - pendentes - (antigo > ultimo ? 1 : 0);
  t[m] = antigo;
  preencher(0, m, aberta, antigo);
  preencher(m, n - 1, antigo, ultimo);
  return { t, primeiroPendente: m, fimPendente: m + pendentes };
}

function embaralhar<T>(lista: T[], r: Sorteio): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = r.inteiro(0, i);
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function dividirEmGrupos(posicoes: number[], quantos: number): number[][] {
  const grupos: number[][] = [];
  const tamanho = Math.ceil(posicoes.length / quantos);
  for (let i = 0; i < posicoes.length; i += tamanho) grupos.push(posicoes.slice(i, i + tamanho));
  return grupos;
}

export interface OpcoesComandas {
  garcom: string;
  /** Mesa com posições: o recurso está ligado no ambiente e a mesa abriu depois da ativação. */
  comPosicoes: boolean;
  nome?: string;
  /** Quantidade de comandas abertas; limitada pelo número de pessoas. */
  comandas: number;
}

/**
 * Gera comandas, itens e posições coerentes com os campos da mesa (consumo, último pedido, pendentes).
 * O consumo da mesa passa a ser a soma exata dos itens.
 */
export function gerarComandas(mesa: Mesa, opcoes: OpcoesComandas): Mesa {
  if (mesa.pessoas === 0 || mesa.total == null) return mesa;

  const r = criarSorteio(7919 * mesa.id + 13);
  const pendentes = mesa.pedidosPendentes ?? 0;
  const abertaHa = mesa.abertaHa ?? 0;
  const ultimo = mesa.semPedido ?? 0;
  const quantas = Math.max(1, Math.min(opcoes.comandas, mesa.pessoas));
  const antigoMaior = (mesa.pendenteHa ?? ultimo) > ultimo ? 1 : 0;

  const linhas = sequenciaDeItens(mesa, Math.max(3, pendentes + antigoMaior + 1, quantas * 2), !opcoes.comPosicoes, r);
  const { t, primeiroPendente, fimPendente } = instantes(linhas.length, pendentes, abertaHa, ultimo, mesa.pendenteHa, r);

  let posicoes: Posicao[] | undefined;
  let ocupadas: number[] = [];
  if (opcoes.comPosicoes) {
    const numeros = Array.from({ length: mesa.lugares }, (_, i) => i + 1);
    ocupadas = embaralhar(numeros, r).slice(0, mesa.pessoas).sort((a, b) => a - b);
    posicoes = numeros.map((numero) => ({ numero, ocupada: ocupadas.includes(numero) }));
    if (opcoes.nome) {
      ocupadas.forEach((numero, i) => {
        posicoes![numero - 1].nome = PRIMEIROS_NOMES[(mesa.id + i) % PRIMEIROS_NOMES.length];
      });
    }
  }

  const grupos = opcoes.comPosicoes ? dividirEmGrupos(ocupadas, quantas) : [];
  const grupoDe = (posicao: number) => grupos.findIndex((g) => g.includes(posicao));
  let cursor = r.inteiro(0, Math.max(0, ocupadas.length - 1));

  const itensPorGrupo: ItemPedido[][] = Array.from({ length: opcoes.comPosicoes ? grupos.length : quantas }, () => []);

  linhas.forEach(({ produto, qtd }, i) => {
    const base = {
      id: `${mesa.id}-${i + 1}`,
      nome: produto.nome,
      qtd,
      valorUnit: produto.preco,
      status: i >= primeiroPendente && i < fimPendente ? ("pendente" as const) : ("entregue" as const),
      lancadoHa: t[i],
    };

    if (!opcoes.comPosicoes) {
      itensPorGrupo[r.inteiro(0, quantas - 1)].push(base);
      return;
    }

    const grandes = grupos.map((g, indice) => ({ g, indice })).filter(({ g }) => g.length >= 2);
    if (produto.tipo === "porcao" && grandes.length > 0) {
      const { g, indice } = r.sortear(grandes);
      const fatia = embaralhar(g, r)
        .slice(0, Math.min(g.length, r.inteiro(2, 3)))
        .sort((a, b) => a - b);
      itensPorGrupo[indice].push({ ...base, compartilhado: { posicoes: fatia } });
      return;
    }

    const posicao = ocupadas[cursor % ocupadas.length];
    cursor += 1;
    itensPorGrupo[grupoDe(posicao)].push({ ...base, posicao });
  });

  const comandas: Comanda[] = itensPorGrupo
    .filter((itens) => itens.length > 0)
    .map((itens, g) => ({
      numero: 9100 + mesa.id * 7 + g,
      titular:
        opcoes.nome || quantas > 1 || r.proximo() < 0.4
          ? PRIMEIROS_NOMES[(mesa.id * 3 + g) % PRIMEIROS_NOMES.length]
          : undefined,
      abertaHa: Math.max(...itens.map((x) => x.lancadoHa)),
      ultimaVendaHa: Math.min(...itens.map((x) => x.lancadoHa)),
      abertoPor: g > 0 && r.proximo() < 0.3 ? "Caixa" : opcoes.garcom,
      itens,
    }));

  const centavos = linhas.reduce((s, l) => s + Math.round(l.produto.preco * 100) * l.qtd, 0);

  return { ...mesa, total: centavos / 100, nome: opcoes.nome, comandas, posicoes };
}
