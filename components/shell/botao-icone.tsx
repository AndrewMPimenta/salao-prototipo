import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BotaoIconeProps {
  rotulo: string;
  onClick: () => void;
  children: ReactNode;
  pressionado?: boolean;
  expandido?: boolean;
  className?: string;
}

/** Alvo de 44px; o `title` dá a dica no desktop e o aria-label cobre leitor de tela. */
export function BotaoIcone({ rotulo, onClick, children, pressionado, expandido, className }: BotaoIconeProps) {
  return (
    <button
      type="button"
      title={rotulo}
      aria-label={rotulo}
      aria-pressed={pressionado}
      aria-expanded={expandido}
      onClick={onClick}
      className={cn(
        "grid size-11 flex-none place-items-center rounded-full text-(--color-ink)",
        "transition-[background-color,scale] duration-100 hover:bg-(--color-ink)/8 active:scale-[0.94] active:bg-(--color-ink)/12",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)",
        pressionado && "bg-(--color-ink)/10",
        className,
      )}
    >
      {children}
    </button>
  );
}
