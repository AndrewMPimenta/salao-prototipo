"use client";

import type { Ref } from "react";
import type { Salao } from "@/hooks/use-salao";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../ui/breadcrumb";
import { ArrowsInIcon, ArrowsOutIcon } from "@phosphor-icons/react";
import { Separator } from "../ui/separator";
import { SidebarTrigger } from "../ui/sidebar";
import { BotaoTema } from "./botao-tema";
import { BotaoIcone } from "./botao-icone";
import { BuscaMesa } from "./busca-mesa";
import { nomeDoSalao } from "./grupos";
import { Atualizado } from "./resumo";
import type { PropsLayout, Vista } from "./tipos";

const ROTULO_VISTA: Record<Vista, string> = { "3d": "3D", planta: "Planta", linha: "Linha do tempo" };

/** Cabeçalho da página: mora só dentro do SidebarInset, à direita da sidebar, nunca por cima dela. */
export function Cabecalho({ salao, buscaRef, telaCheia }: { salao: Salao; buscaRef: Ref<HTMLInputElement>; telaCheia: PropsLayout["telaCheia"] }) {
  const { grupo, salao: nome } = nomeDoSalao(salao.ambientes.find((a) => a.id === salao.ambienteId));

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex min-w-0 flex-1 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" aria-label="Alternar menu lateral" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="flex-nowrap">
            {grupo && (
              <>
                <BreadcrumbItem className="hidden md:block">{grupo}</BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
              </>
            )}
            <BreadcrumbItem className="min-w-0 max-lg:hidden">
              <span className="truncate">{nome}</span>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="max-lg:hidden" />
            <BreadcrumbItem>
              <BreadcrumbPage>{ROTULO_VISTA[salao.vista]}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex flex-none items-center gap-2 px-4">
        <Atualizado className="mr-2 hidden xl:flex" />
        <BuscaMesa
          ambientes={salao.ambientes}
          limiares={salao.limiares}
          onIr={salao.irParaMesa}
          inputRef={buscaRef}
          className="w-56"
        />
        <BotaoTema />
        <BotaoIcone rotulo={telaCheia.ativo ? "Sair da tela cheia" : "Tela cheia"} onClick={telaCheia.alternar} lado="bottom">
          {telaCheia.ativo ? <ArrowsInIcon /> : <ArrowsOutIcon />}
        </BotaoIcone>
      </div>
    </header>
  );
}
