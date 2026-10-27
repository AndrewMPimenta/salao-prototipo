import type { ItemPedido, Mesa } from "./types";

/*
  Toda a conta é calculada em CENTAVOS inteiros. Divisão em reais flutuantes perde centavos
  (100 / 3), e a soma das posições precisa fechar exatamente com a mesa.
*/

export type ModoDivisao = "consumo" | "igual";

export interface OpcoesConta {
  modo: ModoDivisao;
  /** Taxa de serviço de 10%, opcional. */
  taxaServico: boolean;
}

export type FormaPagamento = "pix" | "credito" | "debito" | "dinheiro";

export interface LinhaConta {
  itemId: string;
  nome: string;
  qtd: number;
  centavos: number;
  /** Ex.: "½", presente só na parte de um item compartilhado. */
  fracao?: string;
}

export interface ContaPosicao {
  posicao: number;
  ocupada: boolean;
  paga: boolean;
  itens: LinhaConta[];
  compartilhados: LinhaConta[];
  /** Próprios + parte dos compartilhados. No modo "igual" é a fração do subtotal da mesa. */
  subtotal: number;
  servico: number;
  total: number;
}

export const TAXA_SERVICO = 10;

export function paraCentavos(reais: number): number {
  return Math.round(reais * 100);
}

export function formatarCentavos(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function valorItem(item: ItemPedido): number {
  return paraCentavos(item.valorUnit) * item.qtd;
}

/** Divide `total` em `partes` fatias inteiras; as sobras de centavos vão uma a uma às primeiras. */
export function dividirCentavos(total: number, partes: number): number[] {
  if (partes <= 0) return [];
  const base = Math.floor(total / partes);
  const sobra = total - base * partes;
  return Array.from({ length: partes }, (_, i) => base + (i < sobra ? 1 : 0));
}

export function rotuloFracao(partes: number): string {
  if (partes === 2) return "½";
  if (partes === 3) return "⅓";
  if (partes === 4) return "¼";
  return `1/${partes}`;
}

export function itensDaMesa(mesa: Mesa): ItemPedido[] {
  return (mesa.comandas ?? []).flatMap((c) => c.itens);
}

/** Posições que entram na conta: as ocupadas e qualquer uma que apareça num item. */
function numerosEnvolvidos(mesa: Mesa): number[] {
  const set = new Set<number>();
  for (const p of mesa.posicoes ?? []) if (p.ocupada) set.add(p.numero);
  for (const item of itensDaMesa(mesa)) {
    if (item.posicao != null) set.add(item.posicao);
    item.compartilhado?.posicoes.forEach((n) => set.add(n));
  }
  return [...set].sort((a, b) => a - b);
}

export function subtotalMesa(mesa: Mesa): number {
  return itensDaMesa(mesa).reduce((s, i) => s + valorItem(i), 0);
}

export function servicoMesa(mesa: Mesa, opcoes: OpcoesConta): number {
  return opcoes.taxaServico ? Math.round((subtotalMesa(mesa) * TAXA_SERVICO) / 100) : 0;
}

export function totalMesa(mesa: Mesa, opcoes: OpcoesConta): number {
  return subtotalMesa(mesa) + servicoMesa(mesa, opcoes);
}

/**
 * Conta por posição. Sem posições na mesa devolve lista vazia.
 *
 * - "consumo": cada posição paga o que pediu mais a sua parte dos compartilhados; item sem dono
 *   e sem compartilhamento é da mesa e divide entre todas. O serviço é do total da mesa,
 *   distribuído pelo subtotal de cada posição.
 * - "igual": total da mesa ÷ posições. Posição paga continua na divisão, para o valor das
 *   demais não mudar depois de uma cobrança.
 *
 * Os centavos que sobram vão para as primeiras posições, e a soma fecha com `totalMesa`.
 */
export function subtotalPorPosicao(mesa: Mesa, opcoes: OpcoesConta): ContaPosicao[] {
  if (!mesa.posicoes) return [];

  const numeros = numerosEnvolvidos(mesa);
  if (numeros.length === 0) return [];

  const estado = new Map((mesa.posicoes ?? []).map((p) => [p.numero, p]));
  const contas = new Map<number, ContaPosicao>(
    numeros.map((n) => [
      n,
      {
        posicao: n,
        ocupada: estado.get(n)?.ocupada ?? true,
        paga: estado.get(n)?.paga ?? false,
        itens: [],
        compartilhados: [],
        subtotal: 0,
        servico: 0,
        total: 0,
      },
    ]),
  );

  const repartir = (item: ItemPedido, donos: number[]) => {
    const partes = dividirCentavos(valorItem(item), donos.length);
    donos.forEach((n, i) => {
      contas.get(n)!.compartilhados.push({
        itemId: item.id,
        nome: item.nome,
        qtd: item.qtd,
        centavos: partes[i],
        fracao: rotuloFracao(donos.length),
      });
    });
  };

  for (const item of itensDaMesa(mesa)) {
    if (item.compartilhado) repartir(item, [...item.compartilhado.posicoes].sort((a, b) => a - b));
    else if (item.posicao != null) {
      contas.get(item.posicao)!.itens.push({ itemId: item.id, nome: item.nome, qtd: item.qtd, centavos: valorItem(item) });
    } else repartir(item, numeros);
  }

  const lista = numeros.map((n) => contas.get(n)!);
  const soma = (c: ContaPosicao) =>
    c.itens.reduce((s, l) => s + l.centavos, 0) + c.compartilhados.reduce((s, l) => s + l.centavos, 0);

  if (opcoes.modo === "igual") {
    const totais = dividirCentavos(totalMesa(mesa, opcoes), lista.length);
    const serv = dividirCentavos(servicoMesa(mesa, opcoes), lista.length);
    lista.forEach((c, i) => {
      c.total = totais[i];
      c.servico = serv[i];
      c.subtotal = totais[i] - serv[i];
    });
    return lista;
  }

  lista.forEach((c) => (c.subtotal = soma(c)));

  // Serviço de cada posição = piso de 10% do seu subtotal; a diferença até o serviço da mesa vai às primeiras.
  const alvo = servicoMesa(mesa, opcoes);
  if (alvo > 0) {
    lista.forEach((c) => (c.servico = Math.floor((c.subtotal * TAXA_SERVICO) / 100)));
    let falta = alvo - lista.reduce((s, c) => s + c.servico, 0);
    for (let i = 0; falta > 0; i = (i + 1) % lista.length, falta--) lista[i].servico += 1;
  }
  lista.forEach((c) => (c.total = c.subtotal + c.servico));
  return lista;
}

/** Quanto ainda falta receber: soma das posições que não foram pagas. */
export function saldoMesa(mesa: Mesa, opcoes: OpcoesConta): number {
  return subtotalPorPosicao(mesa, opcoes)
    .filter((c) => !c.paga)
    .reduce((s, c) => s + c.total, 0);
}

export function resumoPagamento(mesa: Mesa, opcoes: OpcoesConta) {
  // Posição sem nada a cobrar não conta: senão a mesa nunca fecharia.
  const contas = subtotalPorPosicao(mesa, opcoes).filter((c) => c.total > 0);
  const pagas = contas.filter((c) => c.paga).length;
  return { total: contas.length, pagas, quitada: contas.length > 0 && pagas === contas.length };
}

/** Marca a posição como paga sem alterar a mesa original. */
export function cobrarPosicao(mesa: Mesa, numero: number): Mesa {
  if (!mesa.posicoes) return mesa;
  return { ...mesa, posicoes: mesa.posicoes.map((p) => (p.numero === numero ? { ...p, paga: true } : p)) };
}

export function posicaoTemConsumo(mesa: Mesa, numero: number): boolean {
  return itensDaMesa(mesa).some((i) => i.posicao === numero || i.compartilhado?.posicoes.includes(numero));
}
