"use client";

import { useCallback, useEffect, useState } from "react";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useJanela, useMedida } from "@/hooks/use-medida";
import { TableSheet } from "../table-sheet";
import { Button } from "../ui/button";
import { Drawer } from "../ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { SidebarTrigger } from "../ui/sidebar";
import { AreaCanvas } from "./area-canvas";
import { BotaoTema } from "./botao-tema";
import { BuscaMesa } from "./busca-mesa";
import { PilulaImersivo } from "./controles-janela";
import { ConteudoMesas } from "./conteudo-mesas";
import { nomeDoSalao } from "./grupos";
import { Kpis } from "./kpis";
import { LogoMulticlubes } from "./logo-multiclubes";
import { Atualizado } from "./resumo";
import type { PropsLayout } from "./tipos";

// Alça do Drawer (h-6); o resto do peek é a altura medida do cabeçalho.
const ALCA = 24;

/** Conteúdo do SidebarInset no celular: cabeçalho enxuto, números em faixa, a cena e a lista de mesas na gaveta. */
export function LayoutMovel({ salao, imersivo, telaCheia }: PropsLayout) {
  const janela = useJanela();
  const [medirSheet, sheet] = useMedida();
  const [medirCabecalho, cabecalho] = useMedida();
  const [indice, setIndice] = useState(0);
  const { resumo, mesaSelecionada } = salao;
  const ui = !imersivo;
  const s = janela.seguro;
  const { salao: nome } = nomeDoSalao(salao.ambientes.find((a) => a.id === salao.ambienteId));

  // Com a folha aberta a gaveta não pode brigar com ela pelo mesmo espaço.
  useEffect(() => {
    if (mesaSelecionada) setIndice(0);
  }, [mesaSelecionada]);

  const peek = ALCA + cabecalho.h + s.base;
  const pontos = [peek, Math.max(peek + 80, Math.round(janela.h * 0.5)), Math.max(peek + 160, Math.round(janela.h * 0.88))];
  const alturaBase = mesaSelecionada ? sheet.h : pontos[Math.min(indice, 1)];

  // O filho direto da folha (fixed) é quem tem altura; o wrapper `contents` não tem caixa.
  const ancora = useCallback((el: HTMLElement | null) => medirSheet(el?.firstElementChild as HTMLElement | null), [medirSheet]);

  const irParaMesa = (id: number) => {
    salao.alternarMesa(id);
    setIndice(0);
  };

  return (
    <>
      <header hidden={!ui} className="flex h-14 shrink-0 items-center gap-1 pr-2 pl-1" style={{ paddingTop: s.topo }}>
        <SidebarTrigger className="size-11" aria-label="Abrir menu lateral" />
        <LogoMulticlubes className="h-4 w-auto flex-none text-primary" />
        <p className="m-0 min-w-0 flex-1 truncate px-2 text-right text-sm font-medium text-muted-foreground">{nome}</p>
        <BotaoTema className="rounded-md" />
        <Popover>
          <PopoverTrigger render={<Button variant="ghost" size="icon" aria-label="Ir para mesa" className="size-11" />}>
            <MagnifyingGlassIcon />
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-2">
            <BuscaMesa
              autoFocus
              mesas={salao.todas}
              ambientes={salao.ambientes}
              limiares={salao.limiares}
              onIr={salao.irParaMesa}
            />
          </PopoverContent>
        </Popover>
      </header>

      {ui && (
        <Kpis
          compacto
          resumo={resumo}
          perfil={salao.exibicao.perfil}
          livresAtivo={salao.filtroRapido === "livres"}
          onLivres={() => salao.definirRapido(salao.filtroRapido === "livres" ? "todas" : "livres")}
        />
      )}

      <AreaCanvas
        salao={salao}
        dispositivo="movel"
        baseCoberta={ui ? alturaBase : 0}
        className="rounded-none border-x-0 border-b-0"
      />

      <div className={ui ? "contents" : "hidden"}>
        <Drawer
          rotulo="Mesas do salão"
          pontos={pontos}
          indice={indice}
          onIndiceChange={setIndice}
          cabecalho={
            <div ref={medirCabecalho} className="flex items-center justify-between gap-3 px-4 pb-3">
              <div className="min-w-0">
                <p className="tnum m-0 font-mono text-2xl leading-8 font-semibold">{resumo.livres} livres</p>
                <Atualizado />
              </div>
              <p className="tnum m-0 flex-none text-sm text-muted-foreground">{salao.mesas.length} mesas</p>
            </div>
          }
        >
          <div className="flex h-full flex-col px-4 pb-2">
            <ConteudoMesas salao={salao} onIr={irParaMesa} />
          </div>
        </Drawer>
      </div>

      {mesaSelecionada && (
        <div ref={ancora} className="contents">
          <TableSheet
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
      )}

      <PilulaImersivo visivel={imersivo} onClick={telaCheia.alternar} />
    </>
  );
}
