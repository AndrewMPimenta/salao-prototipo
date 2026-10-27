"use client";

import type { Salao } from "@/hooks/use-salao";
import { cn } from "@/lib/utils";
import { AttentionPanel } from "../attention-panel";
import { BotaoIcone } from "./botao-icone";
import { IconeChevron } from "./icones";
import { materializar } from "./materializar";

interface PainelAtencaoProps {
  salao: Salao;
  aberto: boolean;
  onAbrir: (v: boolean) => void;
  medir: (el: HTMLElement | null) => void;
}

/** Painel recolhível; fechado vira uma pílula com a contagem, na mesma célula, trocando por fusão. */
export function PainelAtencao({ salao, aberto, onAbrir, medir }: PainelAtencaoProps) {
  const n = salao.resumo.atencao;

  return (
    <div className="pointer-events-none grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)] justify-items-end">
      <section
        ref={medir}
        inert={!aberto}
        aria-label="Precisam de atenção"
        className={cn(
          "glass col-start-1 row-start-1 flex max-h-full min-h-0 w-80 flex-col self-start rounded-(--radius-panel)",
          aberto && "pointer-events-auto",
          materializar(aberto, "cima"),
        )}
      >
        <header className="flex flex-none items-center justify-between pl-4 pr-1.5">
          <h2 className="m-0 flex items-baseline gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-(--color-ink-3)">
            Precisam de atenção
            {n > 0 && <span className="tnum font-[family-name:var(--font-mono)] text-[13px] text-(--color-ink-2)">{n}</span>}
          </h2>
          <BotaoIcone rotulo="Recolher painel" expandido onClick={() => onAbrir(false)}>
            <IconeChevron />
          </BotaoIcone>
        </header>
        <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto px-4 pb-3">
          <AttentionPanel mesas={salao.mesas} limiares={salao.limiares} onSelect={salao.irParaMesa} />
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
