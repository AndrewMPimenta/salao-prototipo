"use client";

import { CaretUpDownIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import type { Salao } from "@/hooks/use-salao";
import type { EstadoMesa } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AmostraEstado } from "../amostra-estado";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { ABAS_MESAS, ListaMesas, mesasDaAba, type AbaMesas } from "./lista-mesas";
import "./shell.css";

interface ConteudoMesasProps {
  salao: Salao;
  /** Seleciona a mesa da linha; o celular também recolhe a gaveta. */
  onIr: (id: number) => void;
  className?: string;
}

const ESTADO_DA_ABA: Partial<Record<AbaMesas, EstadoMesa>> = { livres: "livre", reservadas: "reservada", ocupadas: "ocupada" };

/** O filtro vive no estado do salão, o mesmo que a sidebar e a cena leem: a guia é derivada dele, sem cópia local. */
function abaDe(salao: Salao): AbaMesas {
  if (salao.filtroRapido === "atencao") return "atencao";
  if (salao.filtro === "livre") return "livres";
  if (salao.filtro === "reservada") return "reservadas";
  if (salao.filtro === "ocupada") return "ocupadas";
  return "todas";
}

function Amostra({ aba }: { aba: AbaMesas }) {
  if (aba === "todas") return <span aria-hidden className="size-3 flex-none rounded-full border border-dashed border-muted-foreground/60" />;
  if (aba === "atencao") return <span aria-hidden className="size-3 flex-none rounded-full bg-(--color-alerta-atencao)" />;
  return <AmostraEstado estado={ESTADO_DA_ABA[aba]!} className="size-3" />;
}

/** Filtro de estado em lista suspensa (cinco guias não cabem em 290px), a busca pelo número e a lista; desktop e gaveta do celular. */
export function ConteudoMesas({ salao, onIr, className }: ConteudoMesasProps) {
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);
  const { mesas, limiares } = salao;
  const aba = abaDe(salao);
  const atual = ABAS_MESAS.find((a) => a.valor === aba)!;

  const contagens = useMemo(
    () => Object.fromEntries(ABAS_MESAS.map((a) => [a.valor, mesasDaAba(a.valor, mesas, limiares).length])) as Record<AbaMesas, number>,
    [mesas, limiares],
  );

  const escolher = (v: string) => {
    const guia = v as AbaMesas;
    if (guia === "todas" || guia === "livres" || guia === "atencao") salao.definirRapido(guia);
    else salao.filtrar(ESTADO_DA_ABA[guia]!);
  };

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-2", className)}>
      <DropdownMenu open={aberto} onOpenChange={setAberto}>
        <DropdownMenuTrigger
          aria-label={`Filtrar mesas: ${atual.rotulo}, ${contagens[aba]}`}
          className="flex h-10 w-full flex-none items-center gap-2 rounded-lg border bg-background px-3 text-left text-sm font-medium outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/30 data-popup-open:bg-muted/60"
        >
          <Amostra aba={aba} />
          <span className="min-w-0 flex-1 truncate">{atual.rotulo}</span>
          <span className="tnum font-mono text-xs text-muted-foreground">{contagens[aba]}</span>
          <CaretUpDownIcon aria-hidden className="size-4 flex-none text-muted-foreground" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" sideOffset={4} className="lista-salao w-(--anchor-width) min-w-52">
          <DropdownMenuRadioGroup value={aba} onValueChange={escolher} aria-label="Filtrar mesas">
            {ABAS_MESAS.map((a, i) => (
              <DropdownMenuRadioItem
                key={a.valor}
                value={a.valor}
                aria-label={`${a.rotulo}, ${contagens[a.valor]} mesas`}
                style={{ "--i": i } as React.CSSProperties}
                className="min-h-10"
              >
                <Amostra aba={a.valor} />
                <span className="min-w-0 flex-1 truncate">{a.rotulo}</span>
                <span aria-hidden className="tnum font-mono text-xs text-muted-foreground">
                  {contagens[a.valor]}
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Input
        type="search"
        inputMode="numeric"
        value={busca}
        onChange={(e) => setBusca(e.target.value.replace(/\D/g, ""))}
        placeholder="Buscar mesa"
        aria-label="Buscar mesa pelo número"
        className="h-9 flex-none"
      />

      <div className="min-h-0 flex-1">
        <ScrollArea className="h-full">
          <ListaMesas
            mesas={mesas}
            limiares={limiares}
            hover={salao.hover}
            selecionada={salao.selecionada}
            aba={aba}
            busca={busca}
            onIr={onIr}
          />
        </ScrollArea>
      </div>
    </div>
  );
}
