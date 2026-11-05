"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Salao } from "@/hooks/use-salao";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ABAS_MESAS, ListaMesas, mesasDaAba, type AbaMesas } from "./lista-mesas";

interface ConteudoMesasProps {
  salao: Salao;
  aba: AbaMesas;
  onAba: (aba: AbaMesas) => void;
  /** Seleciona a mesa da linha; o celular também recolhe a gaveta. */
  onIr: (id: number) => void;
  className?: string;
}

/** As guias Todas, Livres, Reservadas, Ocupadas e Atenção com a lista de cada uma, no desktop e na gaveta do celular. */
export function ConteudoMesas({ salao, aba, onAba, onIr, className }: ConteudoMesasProps) {
  const [busca, setBusca] = useState("");
  const guias = useRef<HTMLDivElement>(null);

  // As cinco guias passam da largura do painel: a lista abre sempre na primeira, sem herdar a rolagem do foco.
  useEffect(() => {
    if (guias.current) guias.current.scrollLeft = 0;
  }, []);
  const { mesas, limiares } = salao;

  const contagens = useMemo(
    () => Object.fromEntries(ABAS_MESAS.map((a) => [a.valor, mesasDaAba(a.valor, mesas, limiares).length])) as Record<AbaMesas, number>,
    [mesas, limiares],
  );

  return (
    <Tabs value={aba} onValueChange={(v) => onAba(v as AbaMesas)} className={cn("min-h-0 flex-1 gap-2", className)}>
      <TabsList ref={guias} aria-label="Estado das mesas" className="scrollbar-none h-9 w-full flex-none justify-start! overflow-x-auto">
        {ABAS_MESAS.map((a) => (
          <TabsTrigger key={a.valor} value={a.valor} className="flex-none gap-1 px-2 text-xs">
            {a.rotulo}
            <span className="tnum font-mono text-[11px] text-muted-foreground">{contagens[a.valor]}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      <Input
        type="search"
        inputMode="numeric"
        value={busca}
        onChange={(e) => setBusca(e.target.value.replace(/\D/g, ""))}
        placeholder="Buscar mesa"
        aria-label="Buscar mesa pelo número"
        className="h-9 flex-none"
      />

      {ABAS_MESAS.map((a) => (
        <TabsContent key={a.valor} value={a.valor} className="min-h-0 flex-1">
          <ScrollArea className="h-full">
            <ListaMesas
              mesas={mesas}
              limiares={limiares}
              hover={salao.hover}
              selecionada={salao.selecionada}
              aba={a.valor}
              busca={busca}
              onIr={onIr}
            />
          </ScrollArea>
        </TabsContent>
      ))}
    </Tabs>
  );
}
