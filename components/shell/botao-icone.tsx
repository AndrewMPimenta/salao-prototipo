"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface BotaoIconeProps {
  rotulo: string;
  onClick: () => void;
  children: ReactNode;
  pressionado?: boolean;
  expandido?: boolean;
  className?: string;
  /** Lado da dica; a barra da câmera abre para o lado que ela deixa livre. */
  lado?: "top" | "bottom" | "left" | "right";
}

/** Alvo de 44px no celular e 36px no desktop; a dica é o rótulo e o aria-label cobre leitor de tela. */
export function BotaoIcone({ rotulo, onClick, children, pressionado, expandido, className, lado = "top" }: BotaoIconeProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={rotulo}
            aria-pressed={pressionado}
            aria-expanded={expandido}
            onClick={onClick}
            className={cn("size-11 flex-none rounded-full lg:size-9", pressionado && "bg-muted", className)}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side={lado}>{rotulo}</TooltipContent>
    </Tooltip>
  );
}
