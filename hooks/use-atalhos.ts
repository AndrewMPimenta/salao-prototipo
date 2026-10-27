"use client";

import { useEffect } from "react";

type Mapa = Record<string, () => void>;

/**
 * Atalhos de tecla única precisam poder ser desligados — é o que a SC 2.1.4
 * (Character Key Shortcuts) exige. Por isso `habilitado` é parâmetro e não
 * constante: a preferência do usuário desliga o hook inteiro.
 *
 * Nota: o texto normativo da 2.1.4 não foi verificado durante a pesquisa que
 * originou este projeto. Confira em w3.org antes de fechar a implementação.
 */
export function useAtalhos(mapa: Mapa, habilitado: boolean) {
  useEffect(() => {
    if (!habilitado) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const alvo = e.target as HTMLElement | null;
      const tag = alvo?.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      const acao = mapa[e.key.toLowerCase()];
      if (acao) {
        e.preventDefault();
        acao();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mapa, habilitado]);
}
