"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface OpcaoToggle<T extends string> {
  valor: T;
  rotulo: string;
  desabilitado?: boolean;
}

interface ToggleGroupProps<T extends string> {
  opcoes: OpcaoToggle<T>[];
  valor: T;
  onChange: (valor: T) => void;
  rotulo: string;
  tamanho?: "sm" | "md";
  className?: string;
}

/**
 * Controle segmentado. O segmento selecionado é uma peça elevada que desliza
 * entre as opções: o deslocamento mostra de onde o valor veio, e a elevação
 * (sombra + superfície clara) o separa do trilho também sobre vidro, onde só
 * a cor de fundo não bastaria.
 */
export function ToggleGroup<T extends string>({
  opcoes,
  valor,
  onChange,
  rotulo,
  tamanho = "md",
  className,
}: ToggleGroupProps<T>) {
  const raiz = useRef<HTMLDivElement>(null);
  const [marca, setMarca] = useState<{ x: number; w: number } | null>(null);

  // Mede o botão real: as larguras variam com o rótulo, então não há grade fixa.
  useLayoutEffect(() => {
    const medir = () => {
      const ativo = raiz.current?.querySelector<HTMLElement>("[aria-pressed='true']");
      setMarca(ativo ? { x: ativo.offsetLeft, w: ativo.offsetWidth } : null);
    };
    medir();
    const obs = new ResizeObserver(medir);
    if (raiz.current) obs.observe(raiz.current);
    return () => obs.disconnect();
  }, [valor, opcoes]);

  return (
    <div
      ref={raiz}
      role="group"
      aria-label={rotulo}
      className={cn(
        "relative inline-flex rounded-(--radius-control) bg-(--color-ink)/8 p-1",
        className,
      )}
    >
      {marca && (
        <span
          aria-hidden
          className={cn(
            "absolute inset-y-1 left-0 rounded-[8px] bg-(--color-raised)",
            "shadow-[0_1px_2px_rgb(40_30_15/0.18),0_0_0_1px_var(--color-line)]",
            "transition-[transform,width] duration-250 ease-(--ease-out-soft)",
          )}
          style={{ width: marca.w, transform: `translateX(${marca.x}px)` }}
        />
      )}

      {opcoes.map((o) => (
        <button
          key={o.valor}
          type="button"
          disabled={o.desabilitado}
          aria-pressed={valor === o.valor}
          onClick={() => onChange(o.valor)}
          className={cn(
            "relative z-10 rounded-[8px] font-medium transition-[color,transform] duration-100 active:scale-[0.97]",
            tamanho === "sm" ? "min-h-8 px-3 text-xs" : "min-h-9 px-4 text-sm",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)",
            "disabled:cursor-not-allowed disabled:opacity-40",
            valor === o.valor
              ? "font-semibold text-(--color-ink)"
              : "text-(--color-ink-2) hover:text-(--color-ink)",
          )}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}
