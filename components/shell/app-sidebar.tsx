"use client";

import {
  ArrowsInIcon,
  ArrowsOutIcon,
  CaretRightIcon,
  CheckCircleIcon,
  ClockIcon,
  CubeIcon,
  EyeIcon,
  KeyboardIcon,
  ListBulletsIcon,
  MapTrifoldIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import { useEffect, useState, type ComponentProps, type ComponentType } from "react";
import { gravarArmazenado, lerArmazenado } from "@/hooks/use-armazenado";
import type { Salao } from "@/hooks/use-salao";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "../ui/sidebar";
import { LogoMulticlubes, MarcaMulticlubes } from "./logo-multiclubes";
import { exibicaoDe, PainelExibicao } from "./menu-exibicao";
import { SeletorAmbiente } from "./seletor-ambiente";
import type { FiltroRapido, Vista } from "./tipos";

const CHAVE_EXIBICAO = "salao:sidebar:exibicao";

const VISTAS: { valor: Vista; rotulo: string; Icone: ComponentType }[] = [
  { valor: "3d", rotulo: "3D", Icone: CubeIcon },
  { valor: "planta", rotulo: "Planta", Icone: MapTrifoldIcon },
  { valor: "linha", rotulo: "Linha do tempo", Icone: ClockIcon },
];

interface AppSidebarProps extends ComponentProps<typeof Sidebar> {
  salao: Salao;
  telaCheia: { ativo: boolean; imersivoNoLugar: boolean; alternar: () => void };
  onAjuda: () => void;
}

/** A coluna da esquerda, de altura inteira e independente do cabeçalho da página: marca, salão, vista, filtros, exibição e preferências. */
export function AppSidebar({ salao, telaCheia, onAjuda, ...props }: AppSidebarProps) {
  const { resumo } = salao;
  const { state, isMobile, setOpenMobile } = useSidebar();
  // Fechada por padrão: Vista e Filtro rápido ficam à vista; a escolha do usuário é lembrada.
  const [exibicaoAberta, setExibicaoAberta] = useState(false);
  useEffect(() => {
    setExibicaoAberta(lerArmazenado(CHAVE_EXIBICAO, (v) => v === true) ?? false);
  }, []);
  const recolhida = state === "collapsed" && !isMobile;

  const rotuloTelaCheia = telaCheia.imersivoNoLugar
    ? telaCheia.ativo ? "Sair do modo imersivo" : "Modo imersivo"
    : telaCheia.ativo ? "Sair da tela cheia" : "Tela cheia";

  const FILTROS: { valor: FiltroRapido; rotulo: string; Icone: ComponentType; n: number | null }[] = [
    { valor: "todas", rotulo: "Todas", Icone: ListBulletsIcon, n: resumo.total },
    { valor: "livres", rotulo: "Livres", Icone: CheckCircleIcon, n: resumo.livres },
    { valor: "atencao", rotulo: "Atenção", Icone: WarningIcon, n: resumo.atencao },
  ];

  // No celular a sidebar é uma folha: depois de escolher, ela sai da frente da cena.
  const fecharNoCelular = () => isMobile && setOpenMobile(false);

  return (
    <Sidebar variant="inset" collapsible="icon" aria-label="Navegação do salão" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<div />} className="cursor-default hover:bg-transparent active:bg-transparent">
              <span className="flex aspect-square size-8 flex-none items-center justify-center text-primary">
                <MarcaMulticlubes className="h-5! w-6!" />
              </span>
              <span className="grid min-w-0 flex-1 text-left leading-tight">
                <LogoMulticlubes className="block h-4! w-24! text-primary" />
                <span className="truncate text-xs text-muted-foreground">Protótipo V1</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SeletorAmbiente
          ambientes={salao.ambientes}
          ativo={salao.ambienteId}
          onChange={(id) => {
            salao.mudarAmbiente(id);
            fecharNoCelular();
          }}
        />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Vista</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {VISTAS.map(({ valor, rotulo, Icone }) => (
                <SidebarMenuItem key={valor}>
                  <SidebarMenuButton
                    isActive={salao.vista === valor}
                    tooltip={rotulo}
                    aria-pressed={salao.vista === valor}
                    onClick={() => {
                      salao.setVista(valor);
                      fecharNoCelular();
                    }}
                  >
                    <Icone />
                    <span>{rotulo}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Filtro rápido</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {FILTROS.map(({ valor, rotulo, Icone, n }) => (
                <SidebarMenuItem key={valor}>
                  <SidebarMenuButton
                    isActive={salao.filtroRapido === valor}
                    tooltip={n === null ? rotulo : `${rotulo} (${n})`}
                    aria-pressed={salao.filtroRapido === valor}
                    onClick={() => {
                      salao.definirRapido(valor);
                      fecharNoCelular();
                    }}
                  >
                    <Icone />
                    <span>{rotulo}</span>
                  </SidebarMenuButton>
                  {n !== null && <SidebarMenuBadge className="tnum font-mono">{n}</SidebarMenuBadge>}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {recolhida ? (
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <Popover>
                  <PopoverTrigger render={<SidebarMenuButton tooltip="Exibição" />}>
                    <EyeIcon />
                    <span>Exibição</span>
                  </PopoverTrigger>
                  <PopoverContent side="right" align="start" className="w-72">
                    <PainelExibicao {...exibicaoDe(salao)} />
                  </PopoverContent>
                </Popover>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        ) : (
          <Collapsible
            open={exibicaoAberta}
            onOpenChange={(v) => {
              setExibicaoAberta(v);
              gravarArmazenado(CHAVE_EXIBICAO, v);
            }}
            render={<SidebarGroup />} className="group/exibicao">
            <SidebarGroupLabel render={<CollapsibleTrigger />} className="w-full justify-between">
              Exibição
              <CaretRightIcon className="transition-transform group-data-panel-open/exibicao:rotate-90" />
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent className="px-2">
                <PainelExibicao {...exibicaoDe(salao)} />
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Atalhos (?)" onClick={onAjuda}>
              <KeyboardIcon />
              <span>Atalhos</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={rotuloTelaCheia} onClick={telaCheia.alternar}>
              {telaCheia.ativo ? <ArrowsInIcon /> : <ArrowsOutIcon />}
              <span>{rotuloTelaCheia}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
