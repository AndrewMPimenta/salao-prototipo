"use client";

import { useTema, type Tema } from "@/hooks/use-tema";
import { cn } from "@/lib/utils";

const PROXIMO: Record<Tema, Tema> = { claro: "escuro", escuro: "sistema", sistema: "claro" };
const NOME: Record<Tema, string> = { claro: "claro", escuro: "escuro", sistema: "do sistema" };

/**
 * Um único botão que cicla o tema: três opções não justificam um controle
 * segmentado largo num cabeçalho que já disputa espaço. O rótulo anuncia o
 * estado atual e o próximo, porque o ícone sozinho não diz o que o toque faz.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { tema, setTema } = useTema();

  return (
    <button
      type="button"
      onClick={() => setTema(PROXIMO[tema])}
      aria-label={`Tema ${NOME[tema]}. Alternar para ${NOME[PROXIMO[tema]]}.`}
      className={cn(
        "grid size-11 flex-none place-items-center rounded-full text-(--color-ink)",
        "transition-[background-color,transform] duration-100 hover:bg-(--color-ink)/8 active:scale-[0.97]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)",
        className,
      )}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {tema === "claro" && (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
          </>
        )}
        {tema === "escuro" && <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />}
        {tema === "sistema" && (
          <>
            <circle cx="12" cy="12" r="8" />
            <path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor" />
          </>
        )}
      </svg>
    </button>
  );
}
