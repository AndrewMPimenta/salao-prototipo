"use client";

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
  className?: string;
}

export function ToggleGroup<T extends string>({
  opcoes,
  valor,
  onChange,
  rotulo,
  className,
}: ToggleGroupProps<T>) {
  return (
    <div
      role="group"
      aria-label={rotulo}
      className={cn("inline-flex gap-1 rounded-[11px] bg-(--color-sunken)/70 p-1", className)}
    >
      {opcoes.map((o) => (
        <button
          key={o.valor}
          type="button"
          disabled={o.desabilitado}
          aria-pressed={valor === o.valor}
          onClick={() => onChange(o.valor)}
          className={cn(
            "min-h-9 rounded-lg px-4 text-[13px] font-medium text-(--color-ink-2)",
            "transition-colors duration-150",
            "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)",
            "disabled:cursor-not-allowed disabled:opacity-40",
            valor === o.valor &&
              "bg-(--color-raised) font-semibold text-(--color-ink) shadow-[0_1px_3px_rgba(0,0,0,0.12)]",
          )}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}
