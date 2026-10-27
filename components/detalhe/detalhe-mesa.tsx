"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  cobrar,
  definirOcupacao,
  liberarMesa,
  reiniciarCobrancas,
  useCobrancas,
  useMesaComCobrancas,
} from "@/hooks/use-cobrancas";
import { posicoesHabilitadas } from "@/lib/data";
import { cobrarPosicao, formatarCentavos, saldoMesa, type FormaPagamento, type OpcoesConta } from "@/lib/conta";
import type { Limiares, Mesa } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AbaComandas } from "./aba-comandas";
import { AbaPosicoes } from "./aba-posicoes";
import { AbaResumo } from "./aba-resumo";
import { FolhaCobranca, rotuloForma } from "./folha-cobranca";

export interface DetalheMesaProps {
  mesa: Mesa;
  limiares: Limiares;
  /** Chamado depois de uma cobrança simulada confirmada. */
  onCobrar?: (mesaId: number, posicao: number) => void;
  /** Controlada: o pai (a cena 3D) escolhe a posição; `null` limpa a escolha. */
  posicaoSelecionada?: number | null;
  onSelecionarPosicao?: (posicao: number) => void;
  /** Controlada: o pai guarda a aba para a cena 3D poder abrir Posições. */
  aba?: IdAba;
  onAba?: (aba: IdAba) => void;
}

export type IdAba = "resumo" | "comandas" | "posicoes";

/**
 * Detalhe da mesa em abas: Resumo, Comandas e Posições. Sem o recurso de posições no ambiente, ou
 * em mesa aberta antes da ativação, a aba Posições não existe (ou explica por que está vazia).
 */
export function DetalheMesa({ mesa, limiares, onCobrar, posicaoSelecionada, onSelecionarPosicao, aba: abaControlada, onAba }: DetalheMesaProps) {
  const base = useId();
  const mesaAtual = useMesaComCobrancas(mesa);
  const cobranca = useCobrancas(mesa.id);

  const ocupada = mesa.pessoas > 0;
  const habilitada = ocupada && posicoesHabilitadas(mesa.ambienteId);
  const abas: { id: IdAba; rotulo: string }[] = ocupada
    ? [
        { id: "resumo", rotulo: "Resumo" },
        { id: "comandas", rotulo: `Comandas ${mesa.comandas?.length ?? 0}` },
        ...(habilitada ? [{ id: "posicoes" as const, rotulo: "Posições" }] : []),
      ]
    : [{ id: "resumo", rotulo: "Resumo" }];

  const [abaInterna, setAbaInterna] = useState<IdAba>("resumo");
  const aba = abaControlada ?? abaInterna;
  // Ref: o pai costuma passar função inline, e a identidade nova não pode reabrir Posições.
  const aoMudarAba = useRef(onAba);
  aoMudarAba.current = onAba;
  const setAba = useCallback((id: IdAba) => {
    setAbaInterna(id);
    aoMudarAba.current?.(id);
  }, []);
  const [opcoes, setOpcoes] = useState<OpcoesConta>({ modo: "consumo", taxaServico: true });
  const [interna, setInterna] = useState<number | null>(null);
  const [confirmando, setConfirmando] = useState<{ posicao: number; centavos: number } | null>(null);
  const [anuncio, setAnuncio] = useState("");
  const refsAbas = useRef(new Map<IdAba, HTMLButtonElement>());

  const abaAtiva = abas.some((a) => a.id === aba) ? aba : "resumo";
  const selecionada = posicaoSelecionada !== undefined ? posicaoSelecionada : interna;

  // Escolher uma cadeira na cena abre a posição no painel.
  useEffect(() => {
    if (posicaoSelecionada != null && habilitada) setAba("posicoes");
  }, [posicaoSelecionada, habilitada, setAba]);

  const selecionar = (posicao: number) => {
    setInterna(posicao);
    onSelecionarPosicao?.(posicao);
  };

  const fecharFolha = useCallback(() => setConfirmando(null), []);

  const confirmar = (forma: FormaPagamento) => {
    if (!confirmando) return;
    const { posicao, centavos } = confirmando;

    cobrar(mesa.id, posicao, forma, centavos);
    onCobrar?.(mesa.id, posicao);

    const saldo = saldoMesa(cobrarPosicao(mesaAtual, posicao), opcoes);
    setAnuncio(
      `Posição ${posicao} paga, ${formatarCentavos(centavos)} em ${rotuloForma(forma)}. ` +
        (saldo > 0 ? `Saldo da mesa ${formatarCentavos(saldo)}.` : "Mesa quitada."),
    );
  };

  const aoTeclarAba = (e: React.KeyboardEvent, indice: number) => {
    const ultimo = abas.length - 1;
    const destino =
      e.key === "ArrowRight" ? (indice + 1) % abas.length
      : e.key === "ArrowLeft" ? (indice - 1 + abas.length) % abas.length
      : e.key === "Home" ? 0
      : e.key === "End" ? ultimo
      : null;
    if (destino === null) return;

    e.preventDefault();
    setAba(abas[destino].id);
    refsAbas.current.get(abas[destino].id)?.focus();
  };

  const idAba = (id: IdAba) => `${base}-aba-${id}`;
  const idPainel = (id: IdAba) => `${base}-painel-${id}`;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {mesa.nome && <p className="m-0 mb-3 flex-none text-[15px] font-semibold leading-6 text-(--color-ink)">{mesa.nome}</p>}

      {abas.length > 1 && (
        <div
          role="tablist"
          aria-label="Detalhes da mesa"
          className="mb-3 flex flex-none rounded-(--radius-control) bg-(--color-ink)/8 p-1"
        >
          {abas.map((a, i) => {
            const ativa = a.id === abaAtiva;
            return (
              <button
                key={a.id}
                ref={(el) => {
                  if (el) refsAbas.current.set(a.id, el);
                  else refsAbas.current.delete(a.id);
                }}
                id={idAba(a.id)}
                role="tab"
                type="button"
                aria-selected={ativa}
                aria-controls={idPainel(a.id)}
                tabIndex={ativa ? 0 : -1}
                onClick={() => setAba(a.id)}
                onKeyDown={(e) => aoTeclarAba(e, i)}
                className={cn(
                  "tnum min-h-9 flex-1 rounded-[8px] px-3 text-[13px] font-medium",
                  "transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.97]",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)",
                  ativa
                    ? "bg-(--color-raised) font-semibold text-(--color-ink) shadow-[0_1px_2px_rgb(40_30_15/0.18),0_0_0_1px_var(--color-line)]"
                    : "text-(--color-ink-2) hover:text-(--color-ink)",
                )}
              >
                {a.rotulo}
              </button>
            );
          })}
        </div>
      )}

      {/* Painéis inativos ficam montados e ocultos: modo de divisão e comanda aberta sobrevivem à troca de aba. */}
      <div className="-m-1 min-h-0 flex-1 overflow-y-auto overscroll-contain p-1">
        <div
          role={abas.length > 1 ? "tabpanel" : undefined}
          id={idPainel("resumo")}
          aria-labelledby={abas.length > 1 ? idAba("resumo") : undefined}
          hidden={abaAtiva !== "resumo"}
        >
          <AbaResumo mesa={mesa} limiares={limiares} />
        </div>

        {ocupada && (
          <div role="tabpanel" id={idPainel("comandas")} aria-labelledby={idAba("comandas")} hidden={abaAtiva !== "comandas"}>
            <AbaComandas mesa={mesa} />
          </div>
        )}

        {habilitada && (
          <div role="tabpanel" id={idPainel("posicoes")} aria-labelledby={idAba("posicoes")} hidden={abaAtiva !== "posicoes"}>
            <AbaPosicoes
              mesa={mesaAtual}
              cobranca={cobranca}
              opcoes={opcoes}
              onOpcoes={setOpcoes}
              selecionada={selecionada}
              onSelecionar={selecionar}
              onCobrar={(posicao, centavos) => setConfirmando({ posicao, centavos })}
              onAlternarOcupacao={(posicao, ocupadaAgora) => {
                definirOcupacao(mesa.id, posicao, ocupadaAgora);
                setAnuncio(`Posição ${posicao} ${ocupadaAgora ? "incluída" : "retirada"}.`);
              }}
              onLiberar={() => {
                liberarMesa(mesa.id);
                setAnuncio(`Mesa ${mesa.id} liberada. Simulado.`);
              }}
              onReabrir={() => {
                reiniciarCobrancas(mesa.id);
                setAnuncio(`Cobranças da mesa ${mesa.id} desfeitas.`);
              }}
            />
          </div>
        )}
      </div>

      {confirmando && (
        <FolhaCobranca
          key={confirmando.posicao}
          posicao={confirmando.posicao}
          centavos={confirmando.centavos}
          onConfirmar={confirmar}
          onFechar={fecharFolha}
        />
      )}

      <div role="status" aria-live="polite" className="sr-only">
        {anuncio}
      </div>
    </div>
  );
}
