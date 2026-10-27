"use client";

import { useState } from "react";
import type { Limiares, Mesa } from "@/lib/types";
import { AMBIENTES, PRACAS } from "@/lib/data";
import { derivarEstado, ROTULO_ESTADO, TRACO_ESTADO } from "@/lib/state";
import { formatarDuracao } from "@/lib/utils";
import { Button } from "./ui/button";

interface TableSheetProps {
  mesa: Mesa;
  limiares: Limiares;
  onClose: () => void;
}

/**
 * Bottom sheet em dois estágios: `peek` mostra identidade e estado, `full`
 * abre os detalhes. Não-bloqueante — overlay no caminho do mapa é atrito
 * medido em pesquisa de usabilidade de seleção espacial.
 */
export function TableSheet({ mesa, limiares, onClose }: TableSheetProps) {
  const [expandido, setExpandido] = useState(false);
  const estado = derivarEstado(mesa, limiares);
  const praca = PRACAS.find((p) => p.id === mesa.pracaId && p.ambienteId === mesa.ambienteId);
  const ambiente = AMBIENTES.find((a) => a.id === mesa.ambienteId);

  return (
    <div
      role="dialog"
      aria-label={`Mesa ${mesa.id}`}
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[390px] rounded-t-2xl border-t border-(--color-line) bg-(--color-surface) px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-2.5 shadow-[0_-8px_30px_rgba(15,20,25,0.26)]"
    >
      <div aria-hidden className="mx-auto mb-3 h-1 w-10 rounded-full bg-(--color-line-2)" />

      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="grid size-11.5 flex-none place-items-center rounded-xl text-base font-bold"
          style={{
            background: `var(--color-${estado}-fill)`,
            boxShadow: `inset 0 0 0 ${TRACO_ESTADO[estado]}px var(--color-${estado}-stroke)`,
            color: `var(--color-${estado}-ink)`,
          }}
        >
          {mesa.id}
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="text-[17px] font-semibold tracking-tight">Mesa {mesa.id}</h4>
          {/* O estado em TEXTO aqui é o que dispensa legenda fixa no celular. */}
          <p className="mt-0.5 text-[13px] text-(--color-ink-2)">{ROTULO_ESTADO[estado]}</p>
        </div>
      </div>

      {expandido && (
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-1.5 border-t border-(--color-line) pt-3 text-[13px]">
          <Item rotulo="Lugares" valor={String(mesa.lugares)} />
          {mesa.pessoas > 0 && <Item rotulo="Pessoas" valor={String(mesa.pessoas)} />}
          {mesa.abertaHa && <Item rotulo="Aberta há" valor={formatarDuracao(mesa.abertaHa)} />}
          {mesa.semPedido != null && <Item rotulo="Sem pedido" valor={`${mesa.semPedido} min`} />}
          {mesa.total && <Item rotulo="Total" valor={mesa.total} />}
          {praca && <Item rotulo="Praça" valor={`${praca.id} · ${praca.garcom}`} />}
          {ambiente && <Item rotulo="Ambiente" valor={ambiente.nome} />}
        </dl>
      )}

      <div className="mt-3 flex gap-2">
        <Button className="flex-1 justify-center" onClick={() => setExpandido((v) => !v)}>
          {expandido ? "Menos" : "Ver detalhes"}
        </Button>
        <Button variante="solido" className="flex-1 justify-center" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </div>
  );
}

function Item({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <>
      <dt className="text-(--color-ink-2)">{rotulo}</dt>
      <dd className="tnum m-0 text-right">{valor}</dd>
    </>
  );
}
