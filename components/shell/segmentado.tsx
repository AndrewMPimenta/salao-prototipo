"use client";

import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";

export interface OpcaoSegmentada<T extends string> {
  valor: T;
  rotulo: string;
  desabilitado?: boolean;
}

interface SegmentadoProps<T extends string> {
  opcoes: OpcaoSegmentada<T>[];
  valor: T;
  onChange: (valor: T) => void;
  rotulo: string;
  className?: string;
}

/** Escolha única entre poucas opções: o ToggleGroup do kit grava um array, o app só quer o valor. */
export function Segmentado<T extends string>({ opcoes, valor, onChange, rotulo, className }: SegmentadoProps<T>) {
  return (
    <ToggleGroup
      aria-label={rotulo}
      variant="outline"
      size="sm"
      spacing={0}
      value={[valor]}
      // Soltar a opção ativa deixaria o grupo sem valor; o estado do app nunca fica vazio.
      onValueChange={(v) => v[0] && onChange(v[0] as T)}
      className={cn("w-full", className)}
    >
      {opcoes.map((o) => (
        <ToggleGroupItem
          key={o.valor}
          value={o.valor}
          disabled={o.desabilitado}
          className="flex-1 px-2 text-xs data-pressed:bg-accent data-pressed:font-semibold"
        >
          {o.rotulo}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
