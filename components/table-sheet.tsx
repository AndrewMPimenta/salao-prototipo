"use client";

import { useState } from "react";
import type { Limiares, Mesa } from "@/lib/types";
import { AMBIENTES, PRACAS } from "@/lib/data";
import { derivarEstado, ROTULO_ESTADO, TRACO_ESTADO } from "@/lib/state";
import { cn, formatarDuracao } from "@/lib/utils";
import { Button } from "./ui/button";

interface TableSheetProps {
  mesa: Mesa;
  limiares: Limiares;
  onClose: () => void;
  variante?: "sheet" | "cartao";
}

/**
 * Painel de detalhe em dois estágios: o primeiro mostra identidade e estado,
 * o segundo abre os detalhes. Não-bloqueante — overlay no caminho do mapa é
 * atrito medido em pesquisa de usabilidade de seleção espacial.
 *
 * `sheet` é a folha fixa do celular; `cartao` é o mesmo conteúdo como cartão
 * de vidro sem posicionamento próprio, para o pai ancorá-lo onde a cena
 * deixar espaço. Por isso o cartão troca o botão "Fechar" por um ×: ele não
 * tem a faixa inferior de ações da folha.
 */
export function TableSheet({ mesa, limiares, onClose, variante = "sheet" }: TableSheetProps) {
  const [expandido, setExpandido] = useState(false);
  const estado = derivarEstado(mesa, limiares);
  const praca = PRACAS.find((p) => p.id === mesa.pracaId && p.ambienteId === mesa.ambienteId);
  const ambiente = AMBIENTES.find((a) => a.id === mesa.ambienteId);
  const cartao = variante === "cartao";

  return (
    <div
      role="dialog"
      aria-label={`Mesa ${mesa.id}`}
      className={cn(
        "animate-surgir",
        cartao
          ? "glass relative w-full rounded-(--radius-panel) p-4"
          : [
              "fixed inset-x-0 bottom-0 z-40 mx-auto w-full rounded-t-[24px] bg-(--color-surface) px-4 pt-2",
              "pb-[calc(1rem+env(safe-area-inset-bottom,0px))]",
              "shadow-[0_-1px_0_var(--color-line),0_-12px_32px_-8px_rgb(40_30_15/0.25)]",
              "sm:max-w-[420px]",
            ],
      )}
    >
      {!cartao && (
        <div aria-hidden className="mx-auto mb-3 h-1 w-9 rounded-full bg-(--color-line-2)" />
      )}

      <div className={cn("flex items-start gap-4", cartao && "pr-11")}>
        <h4 className="font-display m-0 min-w-14 flex-none text-[44px] leading-none">{mesa.id}</h4>

        <div className="min-w-0 flex-1">
          <p className="m-0 truncate text-[11px] font-semibold uppercase leading-4 tracking-[0.06em] text-(--color-ink-3)">
            {[ambiente?.nome, praca && `Praça ${praca.id}`].filter(Boolean).join(" · ") || "Mesa"}
          </p>
          {/* O estado em TEXTO aqui é o que dispensa legenda fixa no celular. */}
          <p className="m-0 mt-1 flex items-center gap-2 text-[15px] font-semibold leading-5 text-(--color-ink)">
            <span
              aria-hidden
              className="size-3.5 flex-none rounded-full"
              style={{
                background: `var(--color-${estado}-fill)`,
                boxShadow: `inset 0 0 0 ${Math.min(TRACO_ESTADO[estado], 2.5)}px var(--color-${estado}-stroke)`,
              }}
            />
            <span className="min-w-0">{ROTULO_ESTADO[estado]}</span>
          </p>
          {mesa.pessoas > 0 && (
            <p className="tnum m-0 mt-1 text-[13px] leading-4 text-(--color-ink-2)">
              {mesa.pessoas} {mesa.pessoas === 1 ? "pessoa" : "pessoas"} · {mesa.lugares} lugares
              {mesa.abertaHa ? ` · aberta há ${formatarDuracao(mesa.abertaHa)}` : ""}
            </p>
          )}
        </div>
      </div>

      {cartao && (
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

      {expandido && (
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-t border-(--color-line) pt-4 text-sm">
          <Item rotulo="Lugares" valor={String(mesa.lugares)} />
          {mesa.pessoas > 0 && <Item rotulo="Pessoas" valor={String(mesa.pessoas)} />}
          {mesa.abertaHa && <Item rotulo="Aberta há" valor={formatarDuracao(mesa.abertaHa)} />}
          {mesa.semPedido != null && <Item rotulo="Sem pedido" valor={`${mesa.semPedido} min`} />}
          {mesa.total && <Item rotulo="Total" valor={mesa.total} />}
          {praca && <Item rotulo="Praça" valor={`${praca.id} · ${praca.garcom}`} />}
          {ambiente && <Item rotulo="Ambiente" valor={ambiente.nome} />}
        </dl>
      )}

      <div className="mt-4 flex gap-2">
        <Button
          variante={cartao ? "silencioso" : "padrao"}
          className="flex-1 justify-center"
          onClick={() => setExpandido((v) => !v)}
        >
          {expandido ? "Menos" : "Ver detalhes"}
        </Button>
        {!cartao && (
          <Button variante="solido" className="flex-1 justify-center" onClick={onClose}>
            Fechar
          </Button>
        )}
      </div>
    </div>
  );
}

function Item({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <>
      <dt className="text-(--color-ink-2)">{rotulo}</dt>
      <dd className="tnum m-0 text-right font-medium">{valor}</dd>
    </>
  );
}
