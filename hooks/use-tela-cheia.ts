"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";

/**
 * Tela cheia nativa quando o navegador oferece; no iPhone Safari a API não
 * existe para elementos, então o mesmo botão liga o modo imersivo, em que a
 * interface some e o app só esconde as próprias barras.
 */
export function useTelaCheia(alvo: RefObject<HTMLElement | null>) {
  const [suportado, setSuportado] = useState(false);
  const [nativo, setNativo] = useState(false);
  const [imersivo, setImersivo] = useState(false);

  useEffect(() => {
    setSuportado(Boolean(document.fullscreenEnabled));
    const aoMudar = () => setNativo(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", aoMudar);
    return () => document.removeEventListener("fullscreenchange", aoMudar);
  }, []);

  const alternar = useCallback(() => {
    if (!suportado) {
      setImersivo((v) => !v);
      return;
    }
    if (document.fullscreenElement) void document.exitFullscreen();
    else alvo.current?.requestFullscreen({ navigationUI: "hide" }).catch(() => setImersivo(true));
  }, [suportado, alvo]);

  const sairImersivo = useCallback(() => setImersivo(false), []);

  return {
    /** Tela cheia nativa ligada, ou modo imersivo no lugar dela. */
    suportado,
    ativo: nativo || imersivo,
    imersivo,
    alternar,
    sairImersivo,
  };
}
