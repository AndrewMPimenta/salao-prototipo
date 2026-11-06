"use client";

import { useEffect, useState } from "react";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import type { Salao } from "@/hooks/use-salao";
import { gravarArmazenado, lerArmazenado } from "@/hooks/use-armazenado";
import { cn } from "@/lib/utils";
import { TableSheet } from "../carregamento-tardio";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { ConteudoMesas } from "./conteudo-mesas";

const CHAVE = "salao:aside:recolhido";

/**
 * O "grupo de mesas": cartão à direita da cena, com as guias de estado e a lista de cada uma. Mesa fixada troca a lista
 * pelo detalhe dentro do mesmo cartão. Recolhido vira um trilho de 56px com as contagens.
 */
export function PainelMesas({ salao }: { salao: Salao }) {
  const { mesaSelecionada, resumo, mesas } = salao;
  const [recolhido, setRecolhido] = useState(() => lerArmazenado(CHAVE, (v) => v === true) ?? false);

  // Fixar uma mesa abre o painel para mostrar o detalhe, sem gravar a preferência; recolher continua possível a qualquer momento.
  const idSelecionada = mesaSelecionada?.id ?? null;
  useEffect(() => {
    if (idSelecionada !== null) setRecolhido(false);
  }, [idSelecionada]);

  const definirRecolhido = (v: boolean) => {
    setRecolhido(v);
    gravarArmazenado(CHAVE, v);
  };

  const n = resumo.atencao;

  return (
    <aside
      aria-label="Mesas do salão"
      className={cn(
        "relative flex h-full flex-none flex-col overflow-hidden rounded-xl border bg-card transition-[width] duration-200 ease-out motion-reduce:transition-none",
        recolhido ? "w-14" : "w-65 xl:w-73",
      )}
    >
      <div
        inert={!recolhido}
        className={cn(
          "absolute inset-y-0 right-0 flex w-14 flex-col items-center gap-1 py-2 transition-opacity duration-150",
          !recolhido && "pointer-events-none opacity-0",
        )}
      >
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="Expandir painel" aria-expanded={false} onClick={() => definirRecolhido(false)} />
            }
          >
            <CaretLeftIcon />
          </TooltipTrigger>
          <TooltipContent side="left">Expandir painel</TooltipContent>
        </Tooltip>
        <ContagemTrilho rotulo="Atenção" valor={n} alerta={n > 0} onClick={() => {
          salao.definirRapido("atencao");
          definirRecolhido(false);
        }} />
        <ContagemTrilho rotulo="Mesas" valor={mesas.length} onClick={() => {
          salao.definirRapido("todas");
          definirRecolhido(false);
        }} />
        {mesaSelecionada && <ContagemTrilho rotulo="Mesa" valor={mesaSelecionada.id} onClick={() => definirRecolhido(false)} />}
      </div>

      <div
        inert={recolhido}
        className={cn(
          "absolute inset-y-0 right-0 flex w-[258px] flex-col gap-2 p-3 xl:w-[290px] transition-opacity duration-150",
          recolhido && "pointer-events-none opacity-0",
        )}
      >
        <header className="flex flex-none items-center justify-between gap-2">
          {mesaSelecionada ? (
            <Button variant="ghost" size="sm" className="-ml-2 gap-0.5 px-2" onClick={() => salao.selecionar(null)}>
              <CaretLeftIcon />
              Mesas
            </Button>
          ) : (
            <h2 className="m-0 text-sm font-semibold">Mesas</h2>
          )}

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Minimizar painel"
                  aria-expanded
                  onClick={() => definirRecolhido(true)}
                />
              }
            >
              <CaretRightIcon />
            </TooltipTrigger>
            <TooltipContent side="left">Minimizar painel</TooltipContent>
          </Tooltip>
        </header>

        {mesaSelecionada ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <TableSheet
              key={mesaSelecionada.id}
              variante="cartao"
              perfil={salao.exibicao.perfil}
              mesa={mesaSelecionada}
              limiares={salao.limiares}
              onClose={() => salao.selecionar(null)}
              aba={salao.abaDetalhe}
              onAba={salao.setAbaDetalhe}
              posicaoSelecionada={salao.posicaoSelecionada}
              onSelecionarPosicao={salao.selecionarPosicao}
            />
          </div>
        ) : (
          <ConteudoMesas salao={salao} onIr={salao.alternarMesa} />
        )}
      </div>
    </aside>
  );
}

function ContagemTrilho({ rotulo, valor, alerta, onClick }: { rotulo: string; valor: number; alerta?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${rotulo}: ${valor}. Abrir painel.`}
      className="flex w-12 flex-col items-center gap-0.5 rounded-lg py-1.5 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30"
    >
      <span
        className={cn(
          "tnum grid h-6 min-w-6 place-items-center rounded-full px-1.5 font-mono text-[13px] font-semibold",
          alerta ? "bg-(--color-alerta-atencao) text-(--color-alerta-atencao-ink)" : "bg-muted",
        )}
      >
        {valor}
      </span>
      <span className="text-[10px] leading-3 text-muted-foreground">{rotulo}</span>
    </button>
  );
}
