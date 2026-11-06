"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import type { Perfil } from "@/lib/exibicao";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { AbaComandas } from "./aba-comandas";
import { AbaPosicoes } from "./aba-posicoes";
import { AbaResumo } from "./aba-resumo";
import { FolhaCobranca, rotuloForma } from "./folha-cobranca";

export interface DetalheMesaProps {
  mesa: Mesa;
  limiares: Limiares;
  /** Maître vê só o Resumo, sem consumo, comandas nem posições. */
  perfil?: Perfil;
  /** Prévia do hover: sem abas de Comandas e Posições. */
  somenteResumo?: boolean;
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
export function DetalheMesa({ mesa, limiares, perfil = "completo", somenteResumo = false, onCobrar, posicaoSelecionada, onSelecionarPosicao, aba: abaControlada, onAba }: DetalheMesaProps) {
  const mesaAtual = useMesaComCobrancas(mesa);
  const cobranca = useCobrancas(mesa.id);

  const ocupada = mesa.pessoas > 0;
  const completo = perfil === "completo" && !somenteResumo;
  const habilitada = completo && ocupada && posicoesHabilitadas(mesa.ambienteId);
  const abas: { id: IdAba; rotulo: string }[] = completo && ocupada
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

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {mesa.nome && <p className="m-0 mb-3 flex-none text-[15px] font-semibold leading-6 text-foreground">{mesa.nome}</p>}

      <Tabs value={abaAtiva} onValueChange={(v) => setAba(v as IdAba)} className="min-h-0 flex-1 gap-3">
        {abas.length > 1 && (
          <TabsList aria-label="Detalhes da mesa" className="w-full flex-none">
            {abas.map((a) => (
              <TabsTrigger key={a.id} value={a.id} className="tnum">
                {a.rotulo}
              </TabsTrigger>
            ))}
          </TabsList>
        )}

        {/* Painéis inativos ficam montados e ocultos: modo de divisão e comanda aberta sobrevivem à troca de aba. */}
        <div className="-m-1 min-h-0 flex-1 overflow-y-auto overscroll-contain p-1">
          <TabsContent value="resumo" keepMounted>
            <AbaResumo mesa={mesa} limiares={limiares} perfil={perfil} />
          </TabsContent>

          {completo && ocupada && (
            <TabsContent value="comandas" keepMounted>
              <AbaComandas mesa={mesa} />
            </TabsContent>
          )}

          {habilitada && (
            <TabsContent value="posicoes" keepMounted>
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
            </TabsContent>
          )}
        </div>
      </Tabs>

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
