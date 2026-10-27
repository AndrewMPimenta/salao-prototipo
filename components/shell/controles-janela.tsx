"use client";

import { cn } from "@/lib/utils";
import { BotaoIcone } from "./botao-icone";
import { IconeExpandir, IconeRecolher } from "./icones";
import { materializar } from "./materializar";

interface BotaoTelaCheiaProps {
  ativo: boolean;
  /** Sem Fullscreen API o botão liga o modo imersivo e o rótulo diz isso. */
  imersivoNoLugar: boolean;
  onClick: () => void;
}

export function BotaoTelaCheia({ ativo, imersivoNoLugar, onClick }: BotaoTelaCheiaProps) {
  const rotulo = imersivoNoLugar
    ? ativo ? "Sair do modo imersivo" : "Modo imersivo"
    : ativo ? "Sair da tela cheia" : "Tela cheia";

  return (
    <BotaoIcone rotulo={rotulo} onClick={onClick}>
      {ativo ? <IconeRecolher /> : <IconeExpandir />}
    </BotaoIcone>
  );
}

/** Único elemento visível no modo imersivo. */
export function PilulaImersivo({ visivel, onClick }: { visivel: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      inert={!visivel}
      onClick={onClick}
      className={cn(
        "glass absolute left-1/2 top-[calc(env(safe-area-inset-top)+12px)] z-30 h-11 -translate-x-1/2 rounded-full px-5 text-[13px] font-medium",
        "active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)",
        materializar(visivel, "cima"),
      )}
    >
      Mostrar controles
    </button>
  );
}
