import { useSyncExternalStore } from "react";

/**
 * Mesa sob o ponteiro, compartilhada entre a cena 3D, a planta e as listas: só destaque visual.
 * Fica fora do estado do React porque a cena não pode re-renderizar a cada passada de mouse:
 * cada consumidor assina só o seu.
 */
export interface ArmazemHover {
  ler: () => number | null;
  assinar: (f: () => void) => () => void;
  definir: (id: number | null) => void;
}

export function criarArmazemHover(): ArmazemHover {
  let atual: number | null = null;
  const ouvintes = new Set<() => void>();

  return {
    ler: () => atual,
    assinar: (f) => {
      ouvintes.add(f);
      return () => void ouvintes.delete(f);
    },
    definir: (id) => {
      if (id === atual) return;
      atual = id;
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
