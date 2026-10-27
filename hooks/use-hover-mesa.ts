import { useEffect, useState, useSyncExternalStore } from "react";

/**
 * Mesa sob o ponteiro, compartilhada entre a cena 3D e as listas. Fica fora do estado do React
 * porque a cena não pode re-renderizar a cada passada de mouse: cada consumidor assina só o seu.
 */
/** Quem originou o hover: a prévia da lista flutua ao lado, a das cenas ocupa o painel. */
export type OrigemHover = "mapa" | "lista";

export interface ArmazemHover {
  ler: () => number | null;
  lerOrigem: () => OrigemHover;
  assinar: (f: () => void) => () => void;
  definir: (id: number | null, origem?: OrigemHover) => void;
}

export function criarArmazemHover(): ArmazemHover {
  let atual: number | null = null;
  let origem: OrigemHover = "mapa";
  const ouvintes = new Set<() => void>();

  return {
    ler: () => atual,
    lerOrigem: () => origem,
    assinar: (f) => {
      ouvintes.add(f);
      return () => void ouvintes.delete(f);
    },
    definir: (id, o = "mapa") => {
      if (id === atual) return;
      atual = id;
      origem = o;
      ouvintes.forEach((f) => f());
    },
  };
}

/** Só re-renderiza quando ESTA mesa entra ou sai do hover. */
export function useHoverMesa(armazem: ArmazemHover, id: number): boolean {
  return useSyncExternalStore(
    armazem.assinar,
    () => armazem.ler() === id,
    () => false,
  );
}

/**
 * Mesa em prévia: entra na hora e sai depois da carência, para o ponteiro poder cruzar do
 * mapa até o painel sem a prévia piscar. A carência só vale para sumir; trocar de mesa é imediato.
 */
export function usePreviaMesa(armazem: ArmazemHover, ativo: boolean, carenciaMs = 150) {
  const bruto = useSyncExternalStore(armazem.assinar, armazem.ler, () => null);
  const [previa, setPrevia] = useState<{ id: number; origem: OrigemHover } | null>(null);

  useEffect(() => {
    if (!ativo || bruto === null) {
      if (!previa) return;
      const t = setTimeout(() => setPrevia(null), ativo ? carenciaMs : 0);
      return () => clearTimeout(t);
    }
    setPrevia((p) => (p?.id === bruto ? p : { id: bruto, origem: armazem.lerOrigem() }));
  }, [bruto, ativo, carenciaMs, armazem, previa]);

  return previa;
}
