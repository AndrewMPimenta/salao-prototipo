"use client";

import { useMemo, useState } from "react";
import type { EstadoCobranca, PagamentoPosicao } from "@/hooks/use-cobrancas";
import {
  formatarCentavos,
  posicaoTemConsumo,
  resumoPagamento,
  saldoMesa,
  subtotalPorPosicao,
  TAXA_SERVICO,
  type ContaPosicao,
  type LinhaConta,
  type ModoDivisao,
  type OpcoesConta,
} from "@/lib/conta";
import type { Mesa } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { ToggleGroup } from "../ui/toggle-group";
import { DiagramaMesa } from "./diagrama-mesa";
import { rotuloForma } from "./folha-cobranca";
import { IconeCheck } from "./icones";

interface AbaPosicoesProps {
  /** Mesa já com ocupação e pagamentos simulados aplicados. */
  mesa: Mesa;
  cobranca: EstadoCobranca;
  opcoes: OpcoesConta;
  onOpcoes: (opcoes: OpcoesConta) => void;
  selecionada: number | null;
  onSelecionar: (numero: number) => void;
  onCobrar: (numero: number, centavos: number) => void;
  onAlternarOcupacao: (numero: number, ocupada: boolean) => void;
  onLiberar: () => void;
  onReabrir: () => void;
}

/** Fechamento por posição: diagrama da mesa, conta da posição escolhida e saldo. */
export function AbaPosicoes({
  mesa,
  cobranca,
  opcoes,
  onOpcoes,
  selecionada,
  onSelecionar,
  onCobrar,
  onAlternarOcupacao,
  onLiberar,
  onReabrir,
}: AbaPosicoesProps) {
  const [editando, setEditando] = useState(false);

  const contas = useMemo(() => subtotalPorPosicao(mesa, opcoes), [mesa, opcoes]);
  const resumo = resumoPagamento(mesa, opcoes);
  const saldo = saldoMesa(mesa, opcoes);
  const algumaPaga = Object.keys(cobranca.pagas).length > 0;

  if (!mesa.posicoes) {
    return (
      <p className="m-0 py-6 text-center text-[13px] leading-5 text-(--color-ink-2)">
        Esta mesa foi aberta antes da ativação das posições. A conta segue pela aba Comandas.
      </p>
    );
  }

  const contaDe = (n: number) => contas.find((c) => c.posicao === n);
  const ocupadas = mesa.posicoes.filter((p) => p.ocupada).length;

  // Sem escolha, abre na primeira posição com algo a pagar: é o que o operador vai fazer.
  const efetiva =
    selecionada ??
    contas.find((c) => c.ocupada && !c.paga && c.total > 0)?.posicao ??
    contas.find((c) => c.ocupada)?.posicao ??
    null;
  const conta = efetiva != null ? contaDe(efetiva) : undefined;

  const rotulo = (n: number) => {
    const p = mesa.posicoes?.find((x) => x.numero === n);
    if (editando) {
      if (!p?.ocupada) return `Posição ${n}, vazia, tocar para incluir`;
      return posicaoBloqueada(n)
        ? `Posição ${n}, com consumo, não pode ser retirada`
        : `Posição ${n}, ocupada, tocar para retirar`;
    }
    const c = contaDe(n);
    if (!p?.ocupada || !c) return `Posição ${n}, vazia`;
    return `Posição ${n}, ${formatarCentavos(c.total)}, ${c.paga ? "paga" : "a pagar"}`;
  };

  function posicaoBloqueada(n: number) {
    return posicaoTemConsumo(mesa, n) || !!mesa.posicoes?.find((p) => p.numero === n)?.paga;
  }

  const travado = algumaPaga || cobranca.liberada;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <ToggleGroup<ModoDivisao>
          rotulo="Modo de divisão da conta"
          valor={opcoes.modo}
          onChange={(modo) => onOpcoes({ ...opcoes, modo })}
          opcoes={[
            { valor: "consumo", rotulo: "Por consumo", desabilitado: travado },
            { valor: "igual", rotulo: "Igualmente", desabilitado: travado },
          ]}
        />
        <Interruptor
          rotulo={`Taxa de serviço ${TAXA_SERVICO}%`}
          ligado={opcoes.taxaServico}
          desabilitado={travado}
          onChange={(taxaServico) => onOpcoes({ ...opcoes, taxaServico })}
        />
      </div>
      {travado && (
        <p className="m-0 -mt-2 text-[12px] leading-4 text-(--color-ink-3)">
          A divisão fica travada depois da primeira cobrança.
        </p>
      )}

      <section aria-label="Diagrama da mesa">
        <DiagramaMesa
          mesa={mesa}
          selecionada={editando ? null : efetiva}
          editando={editando}
          bloqueada={posicaoBloqueada}
          rotulo={rotulo}
          onSelecionar={onSelecionar}
          onAlternarOcupacao={(n) => {
            const atual = mesa.posicoes?.find((p) => p.numero === n);
            onAlternarOcupacao(n, !atual?.ocupada);
          }}
        />
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="tnum m-0 text-[12px] leading-4 text-(--color-ink-2)">
            {editando
              ? "Toque na cadeira para incluir ou retirar. Posição com consumo não sai."
              : `${ocupadas} de ${mesa.lugares} posições ocupadas`}
          </p>
          <Button
            variante="silencioso"
            aria-pressed={editando}
            disabled={cobranca.liberada}
            className="flex-none px-3 text-[13px]"
            onClick={() => setEditando((v) => !v)}
          >
            {editando ? "Concluir" : "Editar posições"}
          </Button>
        </div>
      </section>

      {conta && !editando && (
        <CartaoPosicao
          conta={conta}
          modo={opcoes.modo}
          nome={mesa.posicoes.find((p) => p.numero === conta.posicao)?.nome}
          pagamento={cobranca.pagas[conta.posicao]}
          liberada={cobranca.liberada}
          totalPosicoes={resumo.total}
          onCobrar={() => onCobrar(conta.posicao, conta.total)}
        />
      )}

      <Rodape
        saldo={saldo}
        pagas={resumo.pagas}
        total={resumo.total}
        quitada={resumo.quitada}
        liberada={cobranca.liberada}
        onLiberar={onLiberar}
        onReabrir={onReabrir}
      />
    </div>
  );
}

function CartaoPosicao({
  conta,
  modo,
  nome,
  pagamento,
  liberada,
  totalPosicoes,
  onCobrar,
}: {
  conta: ContaPosicao;
  modo: ModoDivisao;
  nome?: string;
  pagamento?: PagamentoPosicao;
  liberada: boolean;
  totalPosicoes: number;
  onCobrar: () => void;
}) {
  const vazia = conta.total === 0;

  return (
    <section
      aria-label={`Conta da posição ${conta.posicao}`}
      className="rounded-(--radius-control) bg-(--color-raised) p-3 shadow-[inset_0_0_0_1px_var(--color-line)]"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h5 className="m-0 text-[15px] font-semibold leading-6 text-(--color-ink)">
            Posição P{conta.posicao}
            {nome && <span className="font-normal text-(--color-ink-2)"> · {nome}</span>}
          </h5>
          <p className="font-display tnum m-0 mt-1 text-[28px] text-(--color-ink)">{formatarCentavos(conta.total)}</p>
        </div>
        {conta.paga && (
          <span className="mt-1 inline-flex flex-none items-center gap-1 rounded-(--radius-chip) bg-(--color-brilho-livre)/16 px-2 py-0.5 text-[11px] font-semibold leading-4 text-(--color-ink)">
            <IconeCheck className="size-3 text-(--color-brilho-livre)" />
            Paga{pagamento ? ` · ${rotuloForma(pagamento.forma)}` : ""}
          </span>
        )}
      </header>

      {modo === "consumo" ? (
        <ul className="m-0 mt-3 flex list-none flex-col gap-1.5 border-t border-(--color-line) p-0 pt-3 text-[13px] leading-5">
          {conta.itens.map((l) => (
            <Linha key={l.itemId} linha={l} />
          ))}
          {conta.compartilhados.map((l) => (
            <Linha key={l.itemId} linha={l} />
          ))}
          {vazia && <li className="text-(--color-ink-2)">Sem consumo nesta posição.</li>}
          {conta.servico > 0 && (
            <li className="flex items-baseline justify-between gap-3 text-(--color-ink-2)">
              <span>Serviço {TAXA_SERVICO}%</span>
              <span className="tnum">{formatarCentavos(conta.servico)}</span>
            </li>
          )}
        </ul>
      ) : (
        <dl className="m-0 mt-3 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 border-t border-(--color-line) pt-3 text-[13px] leading-5">
          <dt className="text-(--color-ink-2)">Parte da conta (1 de {totalPosicoes})</dt>
          <dd className="tnum m-0 text-right">{formatarCentavos(conta.subtotal)}</dd>
          {conta.servico > 0 && (
            <>
              <dt className="text-(--color-ink-2)">Serviço {TAXA_SERVICO}%</dt>
              <dd className="tnum m-0 text-right">{formatarCentavos(conta.servico)}</dd>
            </>
          )}
        </dl>
      )}

      {!conta.paga && !vazia && (
        <Button variante="solido" disabled={liberada} className="tnum mt-3 w-full justify-center" onClick={onCobrar}>
          Cobrar P{conta.posicao} · {formatarCentavos(conta.total)}
        </Button>
      )}
    </section>
  );
}

function Linha({ linha }: { linha: LinhaConta }) {
  return (
    <li className="flex items-baseline justify-between gap-3">
      <span className="min-w-0 text-(--color-ink)">
        {linha.fracao && <span className="tnum text-(--color-ink-2)">{linha.fracao} </span>}
        {linha.qtd > 1 && <span className="tnum text-(--color-ink-2)">{linha.qtd}× </span>}
        {linha.nome}
      </span>
      <span className="tnum flex-none">{formatarCentavos(linha.centavos)}</span>
    </li>
  );
}

function Rodape({
  saldo,
  pagas,
  total,
  quitada,
  liberada,
  onLiberar,
  onReabrir,
}: {
  saldo: number;
  pagas: number;
  total: number;
  quitada: boolean;
  liberada: boolean;
  onLiberar: () => void;
  onReabrir: () => void;
}) {
  return (
    <footer className="border-t border-(--color-line) pt-3">
      {quitada ? (
        <div className="flex items-center gap-3">
          <span className="grid size-9 flex-none place-items-center rounded-full bg-(--color-brilho-livre)/16 text-(--color-brilho-livre)">
            <IconeCheck className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="m-0 text-[15px] font-semibold leading-6 text-(--color-ink)">
              {liberada ? "Mesa liberada" : "Mesa quitada"}
            </p>
            <p className="tnum m-0 text-[12px] leading-4 text-(--color-ink-2)">
              {liberada ? "Simulado: a mesa volta ao salão só ao recarregar." : `${total} de ${total} posições pagas`}
            </p>
          </div>
          {liberada ? (
            <Button variante="padrao" className="flex-none" onClick={onReabrir}>
              Desfazer
            </Button>
          ) : (
            <Button variante="solido" className="flex-none" onClick={onLiberar}>
              Liberar mesa
            </Button>
          )}
        </div>
      ) : (
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="m-0 text-[12px] font-medium leading-4 text-(--color-ink-2)">Saldo da mesa</p>
            <p className="font-display tnum m-0 mt-1 text-[28px] text-(--color-ink)">{formatarCentavos(saldo)}</p>
          </div>
          <div className="min-w-0 pb-1 text-right">
            <p className="tnum m-0 text-[13px] leading-5 text-(--color-ink)">
              {pagas} de {total} posições pagas
            </p>
            <div aria-hidden className="mt-1 ml-auto h-1 w-24 overflow-hidden rounded-full bg-(--color-ink)/10">
              <div
                className="h-full rounded-full bg-(--color-brilho-livre) transition-[width] duration-300 ease-(--ease-out-soft)"
                style={{ width: `${total > 0 ? (pagas / total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}

function Interruptor({
  rotulo,
  ligado,
  desabilitado,
  onChange,
}: {
  rotulo: string;
  ligado: boolean;
  desabilitado?: boolean;
  onChange: (ligado: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      disabled={desabilitado}
      onClick={() => onChange(!ligado)}
      className={cn(
        "inline-flex min-h-11 items-center gap-2.5 rounded-(--radius-control) pr-1 text-[13px] font-medium text-(--color-ink)",
        "transition-transform duration-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "relative h-6 w-10 flex-none rounded-full transition-colors duration-200",
          ligado ? "bg-(--color-accent)" : "bg-(--color-ink)/18",
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 size-5 rounded-full bg-(--color-raised) shadow-[0_1px_2px_rgb(40_30_15/0.3)]",
            "transition-transform duration-200 ease-(--ease-out-soft)",
            ligado && "translate-x-4",
          )}
        />
      </span>
      {rotulo}
    </button>
  );
}
