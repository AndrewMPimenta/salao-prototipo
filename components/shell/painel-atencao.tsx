"use client";

import { useState } from "react";
import type { Salao } from "@/hooks/use-salao";
import { cn } from "@/lib/utils";
import { ToggleGroup } from "../ui/toggle-group";
import { AttentionPanel } from "../attention-panel";
import { BotaoIcone } from "./botao-icone";
import { IconeChevron } from "./icones";
import { ListaMesas } from "./lista-mesas";
import { materializar } from "./materializar";

interface PainelAtencaoProps {
  salao: Salao;
  aberto: boolean;
  onAbrir: (v: boolean) => void;
  medir: (el: HTMLElement | null) => void;
}

type Aba = "atencao" | "mesas";

/** Painel recolhível, com duas abas: o que pede ação e a lista de todas as mesas; fechado vira uma pílula com a contagem, na mesma célula, trocando por fusão. */
export function PainelAtencao({ salao, aberto, onAbrir, medir }: PainelAtencaoProps) {
  const n = salao.resumo.atencao;
  const [aba, setAba] = useState<Aba>("atencao");

  return (
    <div className="pointer-events-none grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)] justify-items-end">
      <section
        ref={medir}
        inert={!aberto}
        aria-label="Atenção e mesas"
        className={cn(
          "glass col-start-1 row-start-1 flex max-h-full min-h-0 w-80 flex-col self-start rounded-(--radius-panel)",
          aberto && "pointer-events-auto",
          materializar(aberto, "cima"),
        )}
      >
        <header className="flex flex-none items-center justify-between py-1 pl-3 pr-1.5">
          <ToggleGroup<Aba>
            rotulo="Conteúdo do painel"
            tamanho="sm"
            valor={aba}
            onChange={setAba}
            opcoes={[
              { valor: "atencao", rotulo: n > 0 ? `Atenção (${n})` : "Atenção" },
              { valor: "mesas", rotulo: "Mesas" },
            ]}
          />
          <BotaoIcone rotulo="Recolher painel" expandido onClick={() => onAbrir(false)}>
            <IconeChevron />
          </BotaoIcone>
        </header>
        <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto px-4 pb-3">
          {aba === "atencao" ? (
            <AttentionPanel mesas={salao.mesas} limiares={salao.limiares} onSelect={salao.irParaMesa} hover={salao.hover} />
          ) : (
            <ListaMesas
              mesas={salao.mesas}
              limiares={salao.limiares}
              hover={salao.hover}
              selecionada={salao.selecionada}
              onIr={salao.irParaMesa}
            />
          )}
        </div>
      </section>

      <button
        type="button"
        inert={aberto}
        aria-expanded={false}
        onClick={() => onAbrir(true)}
        className={cn(
          "glass col-start-1 row-start-1 flex h-11 items-center gap-2 self-start rounded-full pl-4 pr-3 text-[13px] font-medium",
          "active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)",
          !aberto && "pointer-events-auto",
          materializar(!aberto, "baixo"),
        )}
      >
        <span className="tnum font-[family-name:var(--font-mono)] font-semibold">{n}</span>
        {n === 1 ? "precisa de atenção" : "precisam de atenção"}
        <IconeChevron baixo />
      </button>
    </div>
  );
}
