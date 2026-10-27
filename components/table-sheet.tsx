"use client";

import { useState } from "react";
import type { Limiares, Mesa } from "@/lib/types";
import type { Perfil } from "@/lib/exibicao";
import { AMBIENTES, posicoesHabilitadas, PRACAS } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { DetalheMesa, type IdAba } from "./detalhe/detalhe-mesa";

interface TableSheetProps {
  mesa: Mesa;
  limiares: Limiares;
  onClose: () => void;
  /** `previa` é o cartão leve do hover: sem fechar, só o Resumo. */
  variante?: "sheet" | "cartao" | "previa";
  perfil?: Perfil;
  /** Estado compartilhado com a cena 3D; sem eles o painel guarda a própria aba. */
  aba?: IdAba;
  onAba?: (aba: IdAba) => void;
  posicaoSelecionada?: number | null;
  onSelecionarPosicao?: (posicao: number) => void;
}

/**
 * Painel de detalhe, não-bloqueante — overlay no caminho do mapa é atrito
 * medido em pesquisa de usabilidade de seleção espacial. A ordem responde
 * "o que está acontecendo nesta mesa?" em um olhar: identidade, estado e
 * alertas, depois os dados.
 *
 * `sheet` é a folha fixa do celular; `cartao` é o mesmo conteúdo como cartão
 * de vidro sem posicionamento próprio, para o pai ancorá-lo onde a cena
 * deixar espaço. Por isso o cartão troca o botão "Fechar" por um ×: ele não
 * tem a faixa inferior de ações da folha.
 */
export function TableSheet({
  mesa,
  limiares,
  onClose,
  variante = "sheet",
  perfil = "completo",
  aba: abaControlada,
  onAba,
  posicaoSelecionada,
  onSelecionarPosicao,
}: TableSheetProps) {
  const [interna, setInterna] = useState<{ id: number; aba: IdAba }>({ id: mesa.id, aba: "resumo" });
  const habilitada = perfil === "completo" && mesa.pessoas > 0 && posicoesHabilitadas(mesa.ambienteId);
  const abaEscolhida = abaControlada ?? (interna.id === mesa.id ? interna.aba : "resumo");
  const aba = abaEscolhida === "posicoes" && !habilitada ? "resumo" : abaEscolhida;
  const aoMudarAba = (nova: IdAba) => {
    setInterna({ id: mesa.id, aba: nova });
    onAba?.(nova);
  };
  const praca = PRACAS.find((p) => p.id === mesa.pracaId && p.ambienteId === mesa.ambienteId);
  const ambiente = AMBIENTES.find((a) => a.id === mesa.ambienteId);
  const previa = variante === "previa";
  const cartao = variante !== "sheet";

  return (
    <div
      role={previa ? "group" : "dialog"}
      aria-label={previa ? `Prévia da mesa ${mesa.id}` : `Mesa ${mesa.id}`}
      data-previa={previa || undefined}
      className={cn(
        // A prévia troca a cada passada de mouse: sem entrada animada, para não piscar.
        !previa && "animate-surgir",
        cartao
          ? "glass relative flex max-h-[calc(100dvh-7rem)] w-full flex-col rounded-(--radius-panel) p-4"
          : [
              "fixed inset-x-0 bottom-0 z-40 mx-auto flex max-h-[88dvh] w-full flex-col rounded-t-[24px] bg-(--color-surface) px-4 pt-2",
              "pb-[calc(1rem+env(safe-area-inset-bottom,0px))]",
              "shadow-[0_-1px_0_var(--color-line),0_-12px_32px_-8px_rgb(40_30_15/0.25)]",
              "sm:max-w-[420px]",
            ],
      )}
    >
      {!cartao && (
        <div aria-hidden className="mx-auto mb-3 h-1 flex-none w-9 rounded-full bg-(--color-line-2)" />
      )}

      {previa && (
        <p className="m-0 mb-1 text-[11px] font-semibold uppercase leading-4 tracking-[0.08em] text-(--color-ink-3)">Prévia</p>
      )}

      <div className={cn("flex flex-none items-center gap-4", cartao && !previa && "pr-11")}>
        <h4 className="font-display m-0 min-w-14 flex-none text-[44px] leading-none">{mesa.id}</h4>

        <p className="m-0 min-w-0 flex-1 text-[13px] font-medium leading-5 text-(--color-ink-2)">
          {[ambiente?.nome, praca && `Praça ${praca.id}`, praca?.garcom].filter(Boolean).join(" · ") || "Mesa"}
        </p>
      </div>

      {cartao && !previa && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar detalhes da mesa"
          className={cn(
            "absolute right-1 top-1 grid size-11 place-items-center rounded-full text-(--color-ink-2)",
            "transition-[background-color,transform] duration-100 hover:bg-(--color-ink)/8 active:scale-[0.97]",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)",
          )}
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      )}

      <div className="mt-3 flex min-h-0 flex-1 flex-col border-t border-(--color-line) pt-3">
        <DetalheMesa
          key={mesa.id}
          mesa={mesa}
          limiares={limiares}
          perfil={perfil}
          somenteResumo={previa}
          aba={aba}
          onAba={aoMudarAba}
          posicaoSelecionada={posicaoSelecionada}
          onSelecionarPosicao={onSelecionarPosicao}
        />
      </div>

      <div className="mt-3 flex flex-none items-center justify-between gap-3 border-t border-(--color-line) pt-3">
        <p className="m-0 text-[12px] leading-4 text-(--color-ink-3)">
          {perfil === "completo" && aba === "posicoes" ? "Cobrança simulada — não altera o PDV" : "Somente consulta"}
        </p>
        {!cartao && (
          <Button variante="solido" className="min-w-28 justify-center" onClick={onClose}>
            Fechar
          </Button>
        )}
      </div>
    </div>
  );
}
