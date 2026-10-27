"use client";

import { useState } from "react";
import type { Salao } from "@/hooks/use-salao";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "../theme-toggle";
import { BotaoIcone } from "./botao-icone";
import { BuscaMesa } from "./busca-mesa";
import { BotaoTelaCheia } from "./controles-janela";
import { IconeBusca } from "./icones";
import { LogoMulticlubes } from "./logo-multiclubes";
import { materializar } from "./materializar";
import { SeletorAmbiente } from "./seletor-ambiente";
import type { PropsLayout } from "./tipos";

interface BarraMovelProps {
  salao: Salao;
  aberto: boolean;
  telaCheia: PropsLayout["telaCheia"];
  medir: (el: HTMLElement | null) => void;
}

/** Barra única de vidro com o nome e as ações; o seletor de salões fica logo abaixo. */
export function BarraMovel({ salao, aberto, telaCheia, medir }: BarraMovelProps) {
  const [buscando, setBuscando] = useState(false);

  return (
    <header
      ref={medir}
      inert={!aberto}
      className={cn(
        "pointer-events-none absolute inset-x-0 z-20 flex flex-col gap-1",
        "top-[calc(env(safe-area-inset-top)+12px)] px-[calc(env(safe-area-inset-left)+16px)]",
        materializar(aberto, "cima"),
      )}
    >
      <div className="glass pointer-events-auto flex h-14 items-center gap-1 rounded-[22px] pl-4 pr-1.5">
        {buscando ? (
          <>
            <BuscaMesa
              autoFocus
              mesas={salao.todas}
              ambientes={salao.ambientes}
              limiares={salao.limiares}
              onIr={salao.irParaMesa}
              onFechar={() => setBuscando(false)}
              className="animate-surgir -ml-2 flex-1"
            />
            <button
              type="button"
              onClick={() => setBuscando(false)}
              className="h-11 flex-none rounded-full px-3 text-[15px] font-medium text-(--color-focus) active:opacity-60"
            >
              Cancelar
            </button>
          </>
        ) : (
          <>
            <h1 className="m-0 flex min-w-0 flex-1 items-center">
              <span className="sr-only">Ocupação do salão — Restaurante Sede</span>
              <LogoMulticlubes className="h-[18px] w-auto text-(--color-brand)" />
            </h1>
            <BotaoIcone rotulo="Ir para mesa" onClick={() => setBuscando(true)}>
              <IconeBusca />
            </BotaoIcone>
            <ThemeToggle />
            <BotaoTelaCheia ativo={telaCheia.ativo} imersivoNoLugar={telaCheia.imersivoNoLugar} onClick={telaCheia.alternar} />
          </>
        )}
      </div>

      <SeletorAmbiente
        variante="movel"
        ambientes={salao.ambientes}
        mesas={salao.todas}
        ativo={salao.ambienteId}
        onChange={salao.mudarAmbiente}
        className="pointer-events-auto"
      />
    </header>
  );
}
