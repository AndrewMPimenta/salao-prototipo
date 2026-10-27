"use client";

import type { ReactNode } from "react";
import type { Salao } from "@/hooks/use-salao";
import { cn } from "@/lib/utils";
import { ToggleGroup } from "../ui/toggle-group";
import { LogoMulticlubes } from "./logo-multiclubes";
import { materializar } from "./materializar";
import { SeletorAmbiente } from "./seletor-ambiente";
import type { Vista } from "./tipos";

interface BarraDesktopProps {
  salao: Salao;
  aberto: boolean;
  medir: (el: HTMLElement | null) => void;
  /** Campo de busca inline (xl) e botões de ação, montados pelo layout. */
  busca: ReactNode;
  acoes: ReactNode;
}

/**
 * Três cápsulas de vidro: identidade, ambientes e vista/ações. O centro é
 * `flex-1` e abriga o seletor em lista; as laterais nunca encolhem.
 */
export function BarraDesktop({ salao, aberto, medir, busca, acoes }: BarraDesktopProps) {
  const nomeAmbiente = salao.ambientes.find((a) => a.id === salao.ambienteId)?.nome ?? "";

  return (
    <header
      ref={medir}
      inert={!aberto}
      className={cn(
        "pointer-events-none absolute inset-x-0 z-30 flex items-center gap-3",
        "top-[calc(env(safe-area-inset-top)+16px)] px-[calc(env(safe-area-inset-left)+16px)]",
        materializar(aberto, "cima"),
      )}
    >
      <div className="glass pointer-events-auto flex-none rounded-[22px] px-5 py-3">
        <h1 className="sr-only">Ocupação do salão — Restaurante Sede</h1>
        <LogoMulticlubes className="h-5 w-auto text-(--color-brand)" />
        <p className="m-0 mt-2 text-[12px] leading-4 text-(--color-ink-2)">
          Restaurante Sede · somente consulta
          <span className="sr-only"> · {nomeAmbiente}</span>
        </p>
      </div>

      <div className="flex min-w-0 flex-1 justify-center">
        <SeletorAmbiente
          variante="painel"
          ambientes={salao.ambientes}
          mesas={salao.todas}
          ativo={salao.ambienteId}
          onChange={salao.mudarAmbiente}
        />
      </div>

      <div className="glass pointer-events-auto flex flex-none items-center gap-1 rounded-[22px] p-1.5">
        <ToggleGroup<Vista>
          rotulo="Vista do salão"
          tamanho="sm"
          valor={salao.vista}
          onChange={salao.setVista}
          opcoes={[
            { valor: "3d", rotulo: "3D" },
            { valor: "planta", rotulo: "Planta" },
            { valor: "linha", rotulo: "Linha do tempo" },
          ]}
        />
        {busca}
        {acoes}
      </div>
    </header>
  );
}
