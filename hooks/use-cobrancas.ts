"use client";

import { useMemo, useSyncExternalStore } from "react";
import { cobrarPosicao, type FormaPagamento } from "@/lib/conta";
import type { Mesa } from "@/lib/types";

/*
  Cobranças simuladas, em memória e por mesa. Ficam fora do React para o detalhe e a cena 3D
  lerem a mesma fonte: a cadeira da posição paga esmaece sem o painel passar nada por props.
  Recarregar a página zera tudo, de propósito: o protótipo não persiste.
*/

export interface PagamentoPosicao {
  forma: FormaPagamento;
  /** Valor cobrado, em centavos. */
  centavos: number;
}

export interface EstadoCobranca {
  pagas: Readonly<Record<number, PagamentoPosicao>>;
  /** Posições que entraram ou saíram da mesa pelo painel (número → ocupada). */
  ocupacao: Readonly<Record<number, boolean>>;
  liberada: boolean;
}

const VAZIO: EstadoCobranca = { pagas: {}, ocupacao: {}, liberada: false };

const estados = new Map<number, EstadoCobranca>();
const ouvintes = new Set<() => void>();

function atualizar(mesaId: number, alterar: (atual: EstadoCobranca) => EstadoCobranca) {
  estados.set(mesaId, alterar(estados.get(mesaId) ?? VAZIO));
  ouvintes.forEach((o) => o());
}

function assinar(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

export function cobrar(mesaId: number, posicao: number, forma: FormaPagamento, centavos: number) {
  atualizar(mesaId, (e) => ({ ...e, pagas: { ...e.pagas, [posicao]: { forma, centavos } } }));
}

export function definirOcupacao(mesaId: number, posicao: number, ocupada: boolean) {
  atualizar(mesaId, (e) => ({ ...e, ocupacao: { ...e.ocupacao, [posicao]: ocupada } }));
}

export function liberarMesa(mesaId: number) {
  atualizar(mesaId, (e) => ({ ...e, liberada: true }));
}

export function reiniciarCobrancas(mesaId: number) {
  atualizar(mesaId, () => VAZIO);
}

export function useCobrancas(mesaId: number): EstadoCobranca {
  return useSyncExternalStore(
    assinar,
    () => estados.get(mesaId) ?? VAZIO,
    () => VAZIO,
  );
}

/** Números das posições já cobradas da mesa; a cena 3D usa para esmaecer cadeira e boneco. */
export function usePosicoesPagas(mesaId: number): number[] {
  const { pagas } = useCobrancas(mesaId);
  return useMemo(() => Object.keys(pagas).map(Number).sort((a, b) => a - b), [pagas]);
}

/** Mesa com ocupação e pagamentos simulados aplicados; sem posições devolve a própria mesa. */
export function aplicarCobrancas(mesa: Mesa, estado: EstadoCobranca): Mesa {
  if (!mesa.posicoes) return mesa;

  let atual: Mesa = {
    ...mesa,
    posicoes: mesa.posicoes.map((p) => (p.numero in estado.ocupacao ? { ...p, ocupada: estado.ocupacao[p.numero] } : p)),
  };
  for (const numero of Object.keys(estado.pagas).map(Number)) atual = cobrarPosicao(atual, numero);
  return atual;
}

export function useMesaComCobrancas(mesa: Mesa): Mesa {
  const estado = useCobrancas(mesa.id);
  return useMemo(() => aplicarCobrancas(mesa, estado), [mesa, estado]);
}
