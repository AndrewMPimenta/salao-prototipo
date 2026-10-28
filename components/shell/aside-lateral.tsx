"use client";

import { useEffect, useRef, useState } from "react";
import type { Salao } from "@/hooks/use-salao";
import { useFadeRolagem } from "@/hooks/use-fade-rolagem";
import { gravarArmazenado, lerArmazenado } from "@/hooks/use-armazenado";
import { cn } from "@/lib/utils";
import { AttentionPanel } from "../attention-panel";
import { TableSheet } from "../table-sheet";
import { ToggleGroup } from "../ui/toggle-group";
import { BotaoIcone } from "./botao-icone";
import { IconeChevronLado } from "./icones";
import { ListaMesas } from "./lista-mesas";
import { materializar } from "./materializar";

type Aba = "atencao" | "mesas";

const CHAVE = "salao:aside:recolhido";
const LARGURA_TRILHO = 56;

interface AsideLateralProps {
  salao: Salao;
  aberto: boolean;
  /** Largura expandida: 380 em telas largas, 340 acima de 1024px. */
  largura: number;
  /** Distância do topo da janela até a base da barra superior. */
  topo: number;
  /** Largura estável do painel, depois que a transição de largura assenta. */
  onLargura: (w: number) => void;
}

/**
 * Painel lateral de altura inteira: abas Atenção e Mesas, e o cartão da mesa
 * selecionada no topo, com a lista ocupando o que sobra. Recolhido vira um
 * trilho de 56px com as contagens; as duas camadas cruzam por opacidade.
 */
export function AsideLateral({ salao, aberto, largura, topo, onLargura }: AsideLateralProps) {
  const { mesaSelecionada, resumo, mesas } = salao;
  const [aba, setAba] = useState<Aba>("atencao");
  const [busca, setBusca] = useState("");
  const [recolhido, setRecolhido] = useState(() => lerArmazenado(CHAVE, (v) => v === true) ?? false);
  const raiz = useRef<HTMLElement>(null);
  const rolagem = useFadeRolagem<HTMLDivElement>();

  // Fixar uma mesa abre o painel para mostrar o cartão, sem gravar a preferência; recolher continua possível a qualquer momento.
  const idSelecionada = mesaSelecionada?.id ?? null;
  useEffect(() => {
    if (idSelecionada !== null) setRecolhido(false);
  }, [idSelecionada]);
  const expandido = !recolhido;
  const n = resumo.atencao;

  const definirRecolhido = (v: boolean) => {
    setRecolhido(v);
    gravarArmazenado(CHAVE, v);
  };

  const abrirAba = (a: Aba) => {
    setAba(a);
    definirRecolhido(false);
  };

  // A cena reenquadra pela largura, mas só quando ela assenta: durante a transição o quadro mudaria a cada frame.
  useEffect(() => {
    const el = raiz.current;
    if (!el) return;
    let primeira = true;
    let espera = 0;
    const obs = new ResizeObserver(() => {
      window.clearTimeout(espera);
      if (primeira) {
        primeira = false;
        onLargura(el.offsetWidth);
        return;
      }
      espera = window.setTimeout(() => onLargura(el.offsetWidth), 90);
    });
    obs.observe(el);
    return () => {
      window.clearTimeout(espera);
      obs.disconnect();
    };
  }, [onLargura]);

  return (
    <>
    <aside
      ref={raiz}
      aria-label="Atenção e mesas"
      inert={!aberto}
      style={{
        top: topo,
        width: expandido ? largura : LARGURA_TRILHO,
        transitionProperty: "width, opacity, translate, scale, filter, visibility",
      }}
      className={cn(
        "glass absolute right-[calc(env(safe-area-inset-right)+12px)] bottom-[calc(env(safe-area-inset-bottom)+12px)] z-10 overflow-hidden rounded-(--radius-panel)",
        materializar(aberto, "cima"),
      )}
    >
      <div
        inert={expandido}
        className={cn(
          "absolute inset-y-0 right-0 flex w-14 flex-col items-center gap-1 py-2 transition-opacity duration-200",
          expandido && "pointer-events-none opacity-0",
        )}
      >
        <BotaoIcone rotulo="Expandir painel" expandido={false} onClick={() => definirRecolhido(false)}>
          <IconeChevronLado />
        </BotaoIcone>
        <ContagemTrilho rotulo="Atenção" valor={n} alerta={n > 0} onClick={() => abrirAba("atencao")} />
        <ContagemTrilho rotulo="Mesas" valor={mesas.length} onClick={() => abrirAba("mesas")} />
        {mesaSelecionada && <ContagemTrilho rotulo="Mesa" valor={mesaSelecionada.id} onClick={() => definirRecolhido(false)} />}
      </div>

      <div
        inert={!expandido}
        style={{ width: largura }}
        className={cn(
          "absolute inset-y-0 right-0 flex flex-col transition-opacity duration-200",
          !expandido && "pointer-events-none opacity-0",
        )}
      >
        <header className="flex flex-none items-center justify-between py-1.5 pr-1.5 pl-3">
          <ToggleGroup<Aba>
            rotulo="Conteúdo do painel"
            tamanho="sm"
            valor={aba}
            onChange={setAba}
            opcoes={[
              { valor: "atencao", rotulo: n > 0 ? `Atenção (${n})` : "Atenção" },
              { valor: "mesas", rotulo: `Mesas (${mesas.length})` },
            ]}
          />
          <BotaoIcone rotulo="Recolher painel" expandido onClick={() => definirRecolhido(true)}>
            <IconeChevronLado direita />
          </BotaoIcone>
        </header>

        {mesaSelecionada && (
          <div className="cartao-embutido flex min-h-0 flex-1 flex-col px-2 pb-2">
            <button
              type="button"
              onClick={() => salao.selecionar(null)}
              className="mb-1 flex h-8 flex-none items-center gap-0.5 rounded-full pr-3 pl-1 text-[13px] font-medium text-(--color-ink-2) hover:bg-(--color-ink)/6 hover:text-(--color-ink) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)"
            >
              <span className="grid size-6 place-items-center scale-[0.8]"><IconeChevronLado /></span>
              Mesas
            </button>
            <TableSheet
              key={mesaSelecionada.id}
              variante="cartao"
              perfil={salao.exibicao.perfil}
              mesa={mesaSelecionada}
              limiares={salao.limiares}
              onClose={() => salao.selecionar(null)}
              aba={salao.abaDetalhe}
              onAba={salao.setAbaDetalhe}
              posicaoSelecionada={salao.posicaoSelecionada}
              onSelecionarPosicao={salao.selecionarPosicao}
            />
          </div>
        )}

        <div className="relative flex min-h-0 flex-1 flex-col">
        {!mesaSelecionada && aba === "mesas" && (
          <div className="flex-none px-3 pb-2">
            <input
              type="search"
              inputMode="numeric"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar mesa"
              aria-label="Buscar mesa pelo número"
              className="h-9 w-full rounded-full bg-(--color-ink)/8 px-3.5 text-[13px] text-(--color-ink) placeholder:text-(--color-ink-3) focus-visible:outline-2 focus-visible:outline-(--color-focus)"
            />
          </div>
        )}

        <div
          ref={rolagem}
          hidden={mesaSelecionada !== null}
          className="rolagem-fade scrollbar-none min-h-0 flex-1 overflow-y-auto px-3 pb-3"
        >
          <div>
            {aba === "atencao" ? (
              <AttentionPanel mesas={salao.mesas} limiares={salao.limiares} onSelect={salao.alternarMesa} hover={salao.hover} />
            ) : (
              <ListaMesas
                mesas={salao.mesas}
                limiares={salao.limiares}
                hover={salao.hover}
                selecionada={salao.selecionada}
                busca={busca}
                onIr={salao.alternarMesa}
              />
            )}
          </div>
        </div>
        </div>
      </div>
    </aside>
    </>
  );
}

function ContagemTrilho({ rotulo, valor, alerta, onClick }: { rotulo: string; valor: number; alerta?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${rotulo}: ${valor}. Abrir painel.`}
      className="flex w-12 flex-col items-center gap-0.5 rounded-[14px] py-1.5 text-(--color-ink) hover:bg-(--color-ink)/8 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)"
    >
      <span
        className={cn(
          "tnum grid h-6 min-w-6 place-items-center rounded-full px-1.5 font-[family-name:var(--font-mono)] text-[13px] font-semibold",
          alerta ? "bg-(--color-alerta-atencao) text-(--color-alerta-atencao-ink)" : "bg-(--color-ink)/8",
        )}
      >
        {valor}
      </span>
      <span className="text-[10px] leading-3 text-(--color-ink-3)">{rotulo}</span>
    </button>
  );
}
