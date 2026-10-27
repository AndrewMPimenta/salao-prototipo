"use client";

import { useCallback, useEffect, useState } from "react";

export type Tema = "claro" | "escuro" | "sistema";

export const CHAVE_TEMA = "tema";

function preferenciaDoSistema(): "claro" | "escuro" {
  if (typeof window === "undefined") return "claro";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro";
}

function resolver(tema: Tema): "claro" | "escuro" {
  return tema === "sistema" ? preferenciaDoSistema() : tema;
}

function aplicar(tema: Tema) {
  document.documentElement.dataset.theme = resolver(tema) === "escuro" ? "dark" : "light";
}

function lerArmazenado(): Tema {
  try {
    const v = localStorage.getItem(CHAVE_TEMA);
    if (v === "claro" || v === "escuro" || v === "sistema") return v;
  } catch {
    // localStorage pode lançar em janela privada ou com dados bloqueados.
  }
  return "claro";
}

/**
 * Fonte única da verdade do tema. O estado inicial é "claro" tanto aqui
 * quanto no script inline do layout — se os dois divergissem, a primeira
 * pintura mostraria um tema e a hidratação trocaria para outro.
 */
export function useTema() {
  const [tema, setTema] = useState<Tema>("claro");

  useEffect(() => {
    setTema(lerArmazenado());
  }, []);

  useEffect(() => {
    aplicar(tema);
    try {
      localStorage.setItem(CHAVE_TEMA, tema);
    } catch {
      // Sem persistência a escolha ainda vale para esta sessão.
    }
  }, [tema]);

  // Em "sistema", acompanha a troca no sistema operacional sem recarregar.
  useEffect(() => {
    if (tema !== "sistema") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const aoTrocar = () => aplicar("sistema");
    mq.addEventListener("change", aoTrocar);
    return () => mq.removeEventListener("change", aoTrocar);
  }, [tema]);

  return { tema, setTema };
}

/**
 * Lê o tema EFETIVO observando o atributo no documento. O 3D precisa disto:
 * as cores da cena são constantes JavaScript, não variáveis CSS, então ele
 * não acompanha a troca sozinho.
 */
export function useTemaEscuro(): boolean {
  const [escuro, setEscuro] = useState(false);

  const sincronizar = useCallback(() => {
    setEscuro(document.documentElement.dataset.theme === "dark");
  }, []);

  useEffect(() => {
    sincronizar();
    const obs = new MutationObserver(sincronizar);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, [sincronizar]);

  return escuro;
}
