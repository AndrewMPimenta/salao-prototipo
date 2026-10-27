"use client";

import { useId, useState } from "react";
import { AMBIENTES } from "@/lib/data";
import { formatarCentavos, rotuloFracao, valorItem } from "@/lib/conta";
import type { Comanda, ItemPedido, Mesa } from "@/lib/types";
import { cn, formatarDuracao } from "@/lib/utils";
import { IconeCheck, IconeRelogio, IconeSeta } from "./icones";

interface AbaComandasProps {
  mesa: Mesa;
}

/** As comandas da mesa, como o cartão do PDV, com os itens sob demanda. */
export function AbaComandas({ mesa }: AbaComandasProps) {
  const comandas = mesa.comandas ?? [];
  // O número da mesa repete entre salões; sem o salão a comanda fica ambígua.
  const salao = AMBIENTES.length > 1 ? AMBIENTES.find((a) => a.id === mesa.ambienteId)?.nome : undefined;

  if (comandas.length === 0) {
    return <p className="m-0 py-6 text-center text-[13px] leading-5 text-(--color-ink-2)">Sem comandas abertas nesta mesa.</p>;
  }

  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {comandas.map((c) => (
        <li key={c.numero}>
          <CartaoComanda comanda={c} mesaId={mesa.id} salao={salao} abertaInicial={comandas.length === 1} />
        </li>
      ))}
    </ul>
  );
}

function CartaoComanda({ comanda, mesaId, salao, abertaInicial }: { comanda: Comanda; mesaId: number; salao?: string; abertaInicial: boolean }) {
  const [aberta, setAberta] = useState(abertaInicial);
  const idLista = useId();
  const total = comanda.itens.reduce((s, i) => s + valorItem(i), 0);
  const qtdItens = comanda.itens.reduce((s, i) => s + i.qtd, 0);
  // Mais recente primeiro: é o que o garçom quer conferir.
  const itens = [...comanda.itens].sort((a, b) => a.lancadoHa - b.lancadoHa);

  return (
    <div className="rounded-(--radius-control) bg-(--color-raised) shadow-[inset_0_0_0_1px_var(--color-line)]">
      <button
        type="button"
        aria-expanded={aberta}
        aria-controls={idLista}
        onClick={() => setAberta((v) => !v)}
        className={cn(
          "flex min-h-11 w-full items-start gap-3 rounded-(--radius-control) p-3 text-left",
          "transition-[background-color,transform] duration-100 hover:bg-(--color-ink)/4 active:scale-[0.99]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)",
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[12px] font-medium leading-4 text-(--color-ink-2)">
            <span className="tnum">Comanda {comanda.numero} · {salao && `${salao} · `}Mesa {mesaId}</span>
            {comanda.titular && <span> · {comanda.titular}</span>}
          </span>
          <span className="font-display tnum mt-1 block text-[28px] leading-none text-(--color-ink)">
            {formatarCentavos(total)}
          </span>
          <span className="tnum mt-2 block text-[12px] leading-4 text-(--color-ink-2)">
            Aberta há {formatarDuracao(comanda.abertaHa)} · Última venda há {formatarDuracao(comanda.ultimaVendaHa)}
          </span>
          <span className="tnum block text-[12px] leading-4 text-(--color-ink-2)">
            {qtdItens} {qtdItens === 1 ? "item" : "itens"} · Aberto por {comanda.abertoPor}
          </span>
        </span>
        <IconeSeta
          className={cn("mt-1 size-5 flex-none text-(--color-ink-3) transition-transform duration-200", aberta && "rotate-180")}
        />
      </button>

      {aberta && (
        <ul id={idLista} className="m-0 flex list-none flex-col border-t border-(--color-line) p-0">
          {itens.map((item) => (
            <LinhaItem key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}

function tagPosicao(item: ItemPedido): string | null {
  if (item.compartilhado) return item.compartilhado.posicoes.map((p) => `P${p}`).join(" · ");
  return item.posicao != null ? `P${item.posicao}` : null;
}

function LinhaItem({ item }: { item: ItemPedido }) {
  const tag = tagPosicao(item);
  const pendente = item.status === "pendente";

  return (
    <li className="flex items-start gap-3 border-b border-(--color-line) px-3 py-2 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="m-0 text-[13px] leading-5 text-(--color-ink)">
          {item.qtd > 1 && <span className="tnum text-(--color-ink-2)">{item.qtd}× </span>}
          {item.nome}
        </p>
        <p className="m-0 mt-1 flex flex-wrap items-center gap-1.5 text-[11px] leading-4">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-(--radius-chip) px-2 py-0.5 font-medium",
              pendente ? "bg-(--color-alerta-entrega)/20 text-(--color-ink)" : "bg-(--color-ink)/6 text-(--color-ink-2)",
            )}
          >
            {pendente ? <IconeRelogio className="size-3" /> : <IconeCheck className="size-3" />}
            {pendente ? "Pendente" : "Entregue"}
          </span>
          {tag && (
            <span className="tnum inline-flex items-center rounded-(--radius-chip) px-2 py-0.5 font-semibold text-(--color-ink) shadow-[inset_0_0_0_1px_var(--color-line-2)]">
              {item.compartilhado && (
                <span className="mr-1 font-normal text-(--color-ink-2)">{rotuloFracao(item.compartilhado.posicoes.length)}</span>
              )}
              {tag}
            </span>
          )}
          <span className="tnum text-(--color-ink-3)">há {formatarDuracao(item.lancadoHa)}</span>
        </p>
      </div>
      <span className="tnum flex-none text-[13px] font-medium leading-5 text-(--color-ink)">
        {formatarCentavos(valorItem(item))}
      </span>
    </li>
  );
}
