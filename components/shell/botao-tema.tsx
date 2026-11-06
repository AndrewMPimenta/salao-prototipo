"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "@phosphor-icons/react";
import type { ComponentType } from "react";
import { useTema, type Tema } from "@/hooks/use-tema";
import { BotaoIcone } from "./botao-icone";

const PROXIMO: Record<Tema, Tema> = { claro: "escuro", escuro: "sistema", sistema: "claro" };
const NOME: Record<Tema, string> = { claro: "claro", escuro: "escuro", sistema: "do sistema" };
const ICONE: Record<Tema, ComponentType> = { claro: SunIcon, escuro: MoonIcon, sistema: MonitorIcon };

/** Fica no cabeçalho da página, não na sidebar: a sidebar some recolhida e perde o rodapé em janela baixa. */
export function BotaoTema({ className }: { className?: string }) {
  const { tema, setTema } = useTema();
  const Icone = ICONE[tema];

  return (
    <BotaoIcone
      rotulo={`Tema ${NOME[tema]}. Alternar para ${NOME[PROXIMO[tema]]}.`}
      onClick={() => setTema(PROXIMO[tema])}
      lado="bottom"
      className={className}
    >
      <Icone />
    </BotaoIcone>
  );
}
