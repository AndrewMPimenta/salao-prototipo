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

/** Opções de texto longo (pt-BR) em coluna: cada linha leva o rótulo inteiro, o que um segmento de largura fixa não garante. */
export function ListaRadio<T extends string>({ opcoes, valor, onChange, rotulo, className }: SegmentadoProps<T>) {
  return (
    <div role="radiogroup" aria-label={rotulo} className={cn("flex flex-col gap-0.5", className)}>
      {opcoes.map((o) => {
        const ativo = o.valor === valor;
        return (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={ativo}
            disabled={o.desabilitado}
            onClick={() => onChange(o.valor)}
            className={cn(
              "flex min-h-9 w-full items-center gap-2 rounded-md px-2 text-left text-xs outline-none hover:bg-accent/60 focus-visible:ring-3 focus-visible:ring-ring/30",
              ativo && "bg-accent font-semibold",
            )}
          >
            <span
              aria-hidden
              className={cn("grid size-3.5 flex-none place-items-center rounded-full border", ativo ? "border-foreground" : "border-muted-foreground/60")}
            >
              {ativo && <span className="size-1.5 rounded-full bg-foreground" />}
            </span>
            {o.rotulo}
          </button>
        );
      })}
    </div>
  );
}
