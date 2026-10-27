"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Esmaece só a borda que tem conteúdo escondido atrás: --fade-t / --fade-b
 * alimentam a máscara de `.rolagem-fade`, em vez de divisórias fixas.
 */
export function useFadeRolagem<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  const atualizar = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const resta = el.scrollHeight - el.clientHeight - el.scrollTop;
    el.style.setProperty("--fade-t", el.scrollTop > 1 ? "24px" : "0px");
    el.style.setProperty("--fade-b", resta > 1 ? "24px" : "0px");
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    atualizar();
    el.addEventListener("scroll", atualizar, { passive: true });
    const obs = new ResizeObserver(atualizar);
    obs.observe(el);
    if (el.firstElementChild) obs.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", atualizar);
      obs.disconnect();
    };
  }, [atualizar]);

  return ref;
}
