"use client";

import { useEffect } from "react";
import type { Mesa } from "@/lib/types";
import { vizinhaNaDirecao } from "@/lib/geometria";

const DIRECOES: Record<string, "cima" | "baixo" | "esquerda" | "direita"> = {
  ArrowUp: "cima",
  ArrowDown: "baixo",
  ArrowLeft: "esquerda",
  ArrowRight: "direita",
};

interface Opcoes {
  mesas: Mesa[];
  ativo: boolean;
  onEscape?: () => void;
}

/**
 * Roving tabindex sobre a planta, no espírito do padrão Grid do ARIA APG: só um
 * elemento fica na sequência de Tab, e as setas movem o foco entre eles. A
 * diferença é que a vizinha é escolhida por geometria, não por ordem do DOM —
 * num mapa de salão a ordem do DOM não tem significado espacial.
 *
 * Um mapa de salão é layout grid, não data grid, então não dar wrap na borda é
 * escolha de projeto e não falha de acessibilidade.
 */
export function useSpatialKeyboard({ mesas, ativo, onEscape }: Opcoes) {
  useEffect(() => {
    if (!ativo) return;

    function onKeyDown(e: KeyboardEvent) {
      const alvo = e.target as HTMLElement | null;
      const tag = alvo?.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      if (e.key === "Escape") {
        onEscape?.();
        return;
      }

      const direcao = DIRECOES[e.key];
      if (!direcao) return;

      const atual = document.activeElement as HTMLElement | null;
      const idAtual = atual?.dataset?.mesaId;
      if (!idAtual) return;

      e.preventDefault();

      const origem = mesas.find((m) => m.id === Number(idAtual));
      if (!origem) return;

      const destino = vizinhaNaDirecao(origem, mesas, direcao);
      if (!destino) return;

      const el = document.querySelector<HTMLElement>(`[data-mesa-id="${destino.id}"]`);
      if (!el) return;

      document
        .querySelectorAll<HTMLElement>("[data-mesa-id]")
        .forEach((n) => (n.tabIndex = -1));
      el.tabIndex = 0;
      el.focus();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mesas, ativo, onEscape]);
}
