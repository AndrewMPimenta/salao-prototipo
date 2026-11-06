"use client";

import { useState } from "react";
import { CaretUpDownIcon, CheckIcon } from "@phosphor-icons/react";
import type { Ambiente } from "@/lib/types";
import { Badge } from "../ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Kbd, KbdGroup } from "../ui/kbd";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "../ui/sidebar";
import "./shell.css";

interface SeletorAmbienteProps {
  ambientes: Ambiente[];
  ativo: string;
  onChange: (id: string) => void;
}

const indice = (i: number) => String(i + 1).padStart(2, "0");

const SEM_DADOS = { total: 0, ocupadas: 0, lotacao: 0 };

/** Troca de salão no cabeçalho da sidebar, no formato do team switcher do shadcn. PgUp e PgDn trocam sem abrir. */
export function SeletorAmbiente({ ambientes, ativo, onChange }: SeletorAmbienteProps) {
  const { isMobile } = useSidebar();
  const [aberto, setAberto] = useState(false);
  const dados = ambientes.map((a) => a.resumo ?? SEM_DADOS);
  const indiceAtivo = Math.max(0, ambientes.findIndex((a) => a.id === ativo));
  const atual = ambientes[indiceAtivo];

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={aberto} onOpenChange={setAberto}>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                tooltip={atual?.nome}
                aria-label={`Salão: ${atual?.nome}, ${dados[indiceAtivo]?.ocupadas} de ${dados[indiceAtivo]?.total} mesas ocupadas. Trocar de salão.`}
                className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
              />
            }
          >
            <span
              aria-hidden
              className="tnum flex aspect-square size-8 flex-none items-center justify-center rounded-lg bg-sidebar-primary font-mono text-xs font-semibold text-sidebar-primary-foreground"
            >
              {indice(indiceAtivo)}
            </span>
            <span className="grid min-w-0 flex-1 text-left leading-tight">
              <span className="truncate text-sm font-semibold">{atual?.nome}</span>
              <span className="tnum truncate font-mono text-xs text-muted-foreground">
                {dados[indiceAtivo]?.ocupadas}/{dados[indiceAtivo]?.total} ocupadas
              </span>
            </span>
            <CaretUpDownIcon aria-hidden className="ml-auto flex-none" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={8}
            className="lista-salao min-w-80 max-w-[calc(100vw-2rem)]"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center justify-between">
                Salões e mesas
                <KbdGroup>
                  <Kbd>PgUp</Kbd>
                  <Kbd>PgDn</Kbd>
                </KbdGroup>
              </DropdownMenuLabel>

              {ambientes.map((a, i) => {
                const d = dados[i];
                const selecionado = a.id === ativo;
                return (
                  <DropdownMenuItem
                    key={a.id}
                    onClick={() => a.id !== ativo && onChange(a.id)}
                    aria-label={`${a.nome}, ${d.ocupadas} de ${d.total} mesas ocupadas`}
                    style={{ "--i": i } as React.CSSProperties}
                    className="min-h-11 gap-3"
                  >
                    <span aria-hidden className="tnum w-5 flex-none font-mono text-xs text-muted-foreground">
                      {indice(i)}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                      <span className="max-w-full truncate">{a.nome}</span>
                      {a.ilustrativo && (
                        <Badge variant="outline" className="h-4 px-1.5 text-[10px] font-normal text-muted-foreground">
                          Layout ilustrativo
                        </Badge>
                      )}
                    </span>
                    <span aria-hidden className="tnum flex-none font-mono text-xs text-muted-foreground">
                      {d.ocupadas}/{d.total}
                    </span>
                    <span aria-hidden className="h-1 w-8 flex-none overflow-hidden rounded-full bg-muted">
                      <span className="block h-full rounded-full bg-foreground" style={{ width: `${d.lotacao}%` }} />
                    </span>
                    <span aria-hidden className="grid size-4 flex-none place-items-center">
                      {selecionado && <CheckIcon className="size-4" />}
                    </span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
