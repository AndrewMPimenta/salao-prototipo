"use client";

import type { Limiares, Mesa } from "@/lib/types";
import { AMBIENTES, PRACAS } from "@/lib/data";
import {
  derivarAlertas,
  derivarEstado,
  minutosAteLiberar,
  ROTULO_ALERTA,
  ROTULO_ESTADO,
  TRACO_ESTADO,
} from "@/lib/state";
import { cn, formatarDuracao, formatarMoeda } from "@/lib/utils";
import { Button } from "./ui/button";
import { FichaAlerta } from "./selo-alerta";

interface TableSheetProps {
  mesa: Mesa;
  limiares: Limiares;
  onClose: () => void;
  variante?: "sheet" | "cartao";
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
export function TableSheet({ mesa, limiares, onClose, variante = "sheet" }: TableSheetProps) {
  const estado = derivarEstado(mesa, limiares);
  const alertas = derivarAlertas(mesa, limiares);
  const praca = PRACAS.find((p) => p.id === mesa.pracaId && p.ambienteId === mesa.ambienteId);
  const ambiente = AMBIENTES.find((a) => a.id === mesa.ambienteId);
  const cartao = variante === "cartao";
  const ocupada = mesa.pessoas > 0;
  const pendentes = mesa.pedidosPendentes ?? 0;
  const restam = minutosAteLiberar(mesa, limiares);

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

      <div className={cn("flex items-center gap-4", cartao && "pr-11")}>
        <h4 className="font-display m-0 min-w-14 flex-none text-[44px] leading-none">{mesa.id}</h4>

        <p className="m-0 min-w-0 flex-1 text-[13px] font-medium leading-5 text-(--color-ink-2)">
          {[ambiente?.nome, praca && `Praça ${praca.id}`, praca?.garcom].filter(Boolean).join(" · ") || "Mesa"}
        </p>
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

      {/* O estado em TEXTO aqui é o que dispensa legenda fixa no celular. */}
      <ul className="m-0 mt-3 flex list-none flex-col gap-2 border-t border-(--color-line) p-0 pt-3">
        <li className="flex items-center gap-2.5 text-[15px] font-semibold leading-6 text-(--color-ink)">
          <span className="grid size-6 flex-none place-items-center">
            <span
              aria-hidden
              className="size-3.5 rounded-full"
              style={{
                background: `var(--color-${estado}-fill)`,
                boxShadow: `inset 0 0 0 ${Math.min(TRACO_ESTADO[estado], 2.5)}px var(--color-${estado}-stroke)`,
              }}
            />
          </span>
          {ROTULO_ESTADO[estado]}
        </li>
        {alertas.map((a) => (
          <li key={a.tipo} className="flex items-center gap-2.5 text-[15px] leading-6 text-(--color-ink)">
            <FichaAlerta tipo={a.tipo} />
            <span className="min-w-0 flex-1">
              <b className="font-semibold">{ROTULO_ALERTA[a.tipo]}</b>{" "}
              <span className="tnum text-(--color-ink-2)">há {formatarDuracao(a.minutos)}</span>
            </span>
          </li>
        ))}
      </ul>

      <dl className="m-0 mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t border-(--color-line) pt-3 text-[13px] leading-5">
        {ocupada ? (
          <>
            <Item rotulo="Pessoas" valor={`${mesa.pessoas} de ${mesa.lugares} lugares`} />
            <Item rotulo="Aberta há" valor={formatarDuracao(mesa.abertaHa ?? 0)} />
            <Item rotulo="Último pedido há" valor={formatarDuracao(mesa.semPedido ?? 0)} />
            <Item
              rotulo="Pedidos pendentes"
              valor={
                pendentes > 0
                  ? `${pendentes} · mais antigo ${formatarDuracao(mesa.pendenteHa ?? 0)}`
                  : "Nenhum"
              }
            />
            {mesa.contaImpressa && <Item rotulo="Conta impressa há" valor={formatarDuracao(mesa.contaImpressaHa ?? 0)} />}
            {mesa.total != null && <Item rotulo="Consumo" valor={formatarMoeda(mesa.total)} />}
            {mesa.total != null && (
              <Item rotulo="Por pessoa" valor={formatarMoeda(mesa.total / mesa.pessoas)} />
            )}
            <Item
              rotulo="Previsão de liberação"
              valor={restam > 0 ? `em ${formatarDuracao(restam)}` : "Passou da média"}
            />
          </>
        ) : (
          <>
            <Item rotulo="Lugares" valor={String(mesa.lugares)} />
            {mesa.livreHa != null && <Item rotulo="Livre há" valor={formatarDuracao(mesa.livreHa)} />}
            <Item
              rotulo="Próxima reserva"
              valor={
                mesa.reserva
                  ? `${mesa.reserva.hora} · ${mesa.reserva.nome} · ${mesa.reserva.pessoas} pessoas`
                  : "Sem reservas"
              }
            />
          </>
        )}
      </dl>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-(--color-line) pt-3">
        <p className="m-0 text-[12px] leading-4 text-(--color-ink-3)">Somente consulta</p>
        {!cartao && (
          <Button variante="solido" className="min-w-28 justify-center" onClick={onClose}>
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
      <dd className="tnum m-0 text-right text-[15px] font-medium leading-5">{valor}</dd>
    </>
  );
}
