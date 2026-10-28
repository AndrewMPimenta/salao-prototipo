"use client";

import * as React from "react";
import type { Alerta, EstadoMesa, Mesa } from "@/lib/types";
import type { Assentos, Destaque } from "@/lib/exibicao";
import { useHoverMesa, type ArmazemHover } from "@/hooks/use-hover-mesa";
import { GLIFO_ESTADO, ROTULO_ESTADO, textoAlerta } from "@/lib/state";
import { posicoesCadeiras } from "@/lib/geometria";
import { cadeirasNumeradas } from "@/lib/assentos";
import { cn, formatarDuracao } from "@/lib/utils";
import { SeloAlerta } from "./selo-alerta";

export type Densidade = "minimo" | "padrao" | "completo";

/** Abaixo disto (px) o tampo é pequeno demais para cadeiras: elas só virariam ruído e custo de DOM. */
const TAMPO_MIN_CADEIRAS_PX = 24;

/** Cor do sinal da mesa, a mesma regra da cena 3D: o alerta vence o estado e ocupada sem alerta fica neutra. */
export function corSinal(estado: EstadoMesa, alertas: Alerta[]): string | null {
  const alerta = alertas[0]?.tipo;
  if (alerta) return `var(--color-alerta-${alerta === "entregaAtrasada" ? "entrega" : alerta === "contaParada" ? "conta" : "critico"})`;
  return estado === "ocupada" || estado === "livre" ? null : `var(--color-brilho-${estado})`;
}

/** Cor e texto do tampo pintado: o alerta vence o estado, como na cena 3D. Livre não pinta (null). */
function topoSinal(estado: EstadoMesa, alertas: Alerta[]): { fundo: string; texto: string } | null {
  const a = alertas[0]?.tipo;
  if (!a && estado === "livre") return null;
  const chave = a ? (a === "entregaAtrasada" ? "entrega" : a === "contaParada" ? "conta" : "critico") : estado;
  return { fundo: `var(--color-topo-${chave})`, texto: `var(--color-topo-${chave}-ink)` };
}

/** Cor do hover = cor do tampo; livre (undefined) usa o creme do tema, ocupada uma versão clara da tinta. */
function corHover(estado: EstadoMesa, alertas: Alerta[], topo: { fundo: string } | null): string | undefined {
  if (topo && (estado !== "ocupada" || alertas.length > 0)) return topo.fundo;
  return estado === "ocupada" ? "var(--color-ocupada-hover)" : undefined;
}

/** Friso, tampo pintado ou brilho: o mesmo vocabulário do destaque escolhido para a cena. */
function estiloTampo(destaque: Destaque, cor: string | null, ocupada: boolean, raio: number, topo: { fundo: string; texto: string } | null): React.CSSProperties {
  const base: React.CSSProperties = { background: "var(--color-raised)", color: "var(--color-ink)", boxShadow: "var(--shadow-table), inset 0 0 0 1px var(--color-line-2)" };

  // Tampo inteiro na cor do sinal, opaco, com a borda um tom mais escura para o contorno ler.
  if (destaque === "tampo" && topo)
    return {
      ...base,
      background: topo.fundo,
      color: topo.texto,
      boxShadow: `var(--shadow-table), inset 0 0 0 2px color-mix(in srgb, ${topo.fundo} 62%, black)`,
    };

  if (ocupada) {
    // Luminância oposta à da livre: aro grosso (~7,5% do raio) ou tampo sólido; alerta e conta trocam só a cor do aro.
    const tinta = "var(--color-ocupada-tinta)";
    const pesado = { ...base, background: `color-mix(in srgb, ${tinta} 25%, var(--color-raised))` };
    if (destaque === "borda") return { ...pesado, boxShadow: `var(--shadow-table), inset 0 0 0 ${Math.max(6, Math.round(raio * 0.15))}px ${cor ?? tinta}` };
    const luz = cor ?? tinta;
    return {
      ...pesado,
      boxShadow: `var(--shadow-table), inset 0 0 0 1px var(--color-line-2), 0 0 0 3px color-mix(in srgb, ${luz} 55%, transparent), 0 0 16px 5px color-mix(in srgb, ${luz} 50%, transparent)`,
    };
  }

  if (!cor) return base;

  if (destaque === "borda") return { ...base, boxShadow: `var(--shadow-table), inset 0 0 0 5px ${cor}` };
  return {
    ...base,
    boxShadow: `var(--shadow-table), inset 0 0 0 1px var(--color-line-2), 0 0 0 3px color-mix(in srgb, ${cor} 35%, transparent), 0 0 18px 6px color-mix(in srgb, ${cor} 45%, transparent)`,
  };
}

interface TableShapeProps {
  mesa: Mesa;
  estado: EstadoMesa;
  alertas: Alerta[];
  densidade: Densidade;
  destaque: Destaque;
  escala?: number;
  selecionada: boolean;
  somenteLeitura?: boolean;
  /** Edição do layout: a mesa só se arrasta, não abre detalhes nem dispara prévia. */
  editando?: boolean;
  hover?: ArmazemHover;
  onSelect?: (id: number) => void;
  tabIndex?: number;
}

export function TableShape({
  mesa,
  estado,
  alertas,
  densidade,
  destaque,
  escala = 1,
  selecionada,
  somenteLeitura,
  editando,
  hover,
  onSelect,
  tabIndex = -1,
}: TableShapeProps) {
  const sobHover = useHoverMesa(hover ?? SEM_HOVER, mesa.id);
  const largura = mesa.largura * escala;
  const altura = mesa.altura * escala;
  const glifo = GLIFO_ESTADO[estado];
  const cor = corSinal(estado, alertas);

  const descricao = [
    `Mesa ${mesa.id}.`,
    ROTULO_ESTADO[estado],
    mesa.pessoas === 0 ? `${mesa.lugares} lugares` : `${mesa.pessoas} pessoas`,
    mesa.abertaHa ? `aberta há ${formatarDuracao(mesa.abertaHa)}` : null,
    ...alertas.map(textoAlerta),
  ]
    .filter(Boolean)
    .join(", ");

  /*
    O número da mesa e o glifo ficam numa linha, o numeral grande embaixo:
    empilhados no centro, os três se sobrepõem em mesas pequenas.
  */
  const conteudo = (
    <>
      <span aria-hidden className="mesa-brilho" />
      <span className="flex items-center gap-[3px] leading-none">
        <span className="text-xs font-semibold opacity-90">{mesa.id}</span>
        {densidade !== "minimo" && glifo && (
          <span aria-hidden className="text-[11px] font-bold leading-none -tracking-[0.08em]">
            {glifo}
          </span>
        )}
      </span>

      {densidade !== "minimo" && estado === "reservada" && mesa.reserva && (
        <span className="tnum font-[family-name:var(--font-mono)] text-[11px] font-semibold leading-none">
          {mesa.reserva.hora}
        </span>
      )}
      {densidade !== "minimo" && (estado === "ocupada" || estado === "conta") && (
        <span className="tnum font-[family-name:var(--font-mono)] text-[11px] font-medium leading-none opacity-80">
          {mesa.pessoas}
        </span>
      )}
      {densidade === "completo" && mesa.abertaHa && (
        <span className="tnum text-[11px] font-medium leading-none opacity-65">
          {formatarDuracao(mesa.abertaHa)}
        </span>
      )}

      <SeloAlerta
        alertas={alertas}
        semMinutos={densidade === "minimo"}
        className="absolute -right-2.5 -top-2.5 rounded-full px-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
      />
    </>
  );

  const brilha = sobHover && !selecionada;
  const topo = topoSinal(estado, alertas);
  const estilo = { width: largura, height: altura, "--hover-cor": corHover(estado, alertas, topo), ...estiloTampo(destaque, cor, estado === "ocupada", Math.min(largura, altura) / 2, topo) } as React.CSSProperties;

  const classes = cn(
    "mesa-tampo absolute left-0 top-0 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-[2px]",
    "transition-[scale,box-shadow] duration-100 ease-out",
    mesa.forma === "redonda" ? "rounded-full" : "rounded-lg",
    selecionada && "scale-[1.04]",
  );

  if (somenteLeitura) {
    return (
      <div role="img" aria-label={descricao} data-hover={brilha || undefined} className={classes} style={estilo}>
        {conteudo}
      </div>
    );
  }

  return (
    <button
      type="button"
      tabIndex={tabIndex}
      data-mesa-id={mesa.id}
      data-hover={brilha || undefined}
      aria-pressed={editando ? undefined : selecionada}
      aria-label={editando ? `${descricao}. Arraste ou use as setas para mover.` : descricao}
      onClick={() => !editando && onSelect?.(mesa.id)}
      onPointerEnter={(e) => !editando && e.pointerType === "mouse" && hover?.definir(mesa.id)}
      onPointerLeave={() => hover?.ler() === mesa.id && hover.definir(null)}
      className={cn(
        classes,
        editando ? "cursor-grab touch-none select-none" : "cursor-pointer active:scale-[0.97]",
        selecionada && "ring-2 ring-(--color-focus) ring-offset-2 ring-offset-(--color-floor)",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)",
      )}
      style={estilo}
    >
      {conteudo}
    </button>
  );
}

const SEM_HOVER: ArmazemHover = {
  ler: () => null,
  assinar: () => () => {},
  definir: () => {},
};

interface CadeirasProps {
  mesa: Mesa;
  escala?: number;
  /** Simplificado: círculos pequenos; completo: cadeiras com ponto de pessoa. */
  nivel: Exclude<Assentos, "nenhum">;
  /** Mesa ocupada pesa mais: os lugares vazios também ficam mais firmes. */
  pesada?: boolean;
  /** Mesa fixada no perfil Completo: etiquetas P1…Pn clicáveis em cada cadeira. */
  posicoes?: { selecionada: number | null; onSelecionar: (numero: number) => void };
}

/**
 * Os assentos ficam do lado de fora da mesa e contam pessoas — o carregador de
 * informação que não depende de cor nenhuma. No simplificado, círculo cheio = ocupado e contorno
 * = vazio; no completo, cadeira com um ponto onde há gente.
 */
export function Cadeiras({ mesa, escala = 1, nivel, pesada = false, posicoes }: CadeirasProps) {
  const simples = nivel === "simplificado";
  const vazio = pesada ? 55 : 38;

  return (
    <div aria-hidden={posicoes ? undefined : true} className="absolute left-0 top-0 h-0 w-0">
      {posicoesCadeiras(mesa).map((c, i) => {
        const ocupada = i < mesa.pessoas;
        const lado = Math.min(Math.max(Math.min(c.largura, c.altura) * escala * 0.9, 6), 10);

        if (simples)
          return (
            <span
              key={i}
              aria-hidden
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: c.x * escala,
                top: c.y * escala,
                width: lado,
                height: lado,
                background: ocupada ? "var(--color-ink)" : "transparent",
                boxShadow: ocupada ? undefined : `inset 0 0 0 1.5px color-mix(in srgb, var(--color-ink) ${vazio}%, transparent)`,
              }}
            />
          );

        return (
          <span
            key={i}
            aria-hidden
            className="absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[2px]"
            style={{
              left: c.x * escala,
              top: c.y * escala,
              width: c.largura * escala,
              height: c.altura * escala,
              background: ocupada ? "color-mix(in srgb, var(--color-ink) 55%, transparent)" : `color-mix(in srgb, var(--color-ink) ${pesada ? 20 : 13}%, transparent)`,
            }}
          >
            {ocupada && <span className="size-[55%] rounded-full bg-(--color-ink)" />}
          </span>
        );
      })}
      {posicoes &&
        cadeirasNumeradas(mesa).map((c) => {
          const ocupada = mesa.posicoes?.find((p) => p.numero === c.numero)?.ocupada ?? false;
          const norma = Math.hypot(c.x, c.y) || 1;
          const afasta = Math.max(c.largura, c.altura) / 2 + 9;
          const selecionada = posicoes.selecionada === c.numero;

          return (
            <button
              key={c.numero}
              type="button"
              tabIndex={-1}
              aria-label={`Posição ${c.numero}${ocupada ? "" : ", livre"}`}
              onClick={(e) => {
                // Sem isto o clique sobe ao tampo e solta a mesa em vez de escolher a posição.
                e.stopPropagation();
                posicoes.onSelecionar(c.numero);
              }}
              style={{ left: (c.x + (c.x / norma) * afasta) * escala, top: (c.y + (c.y / norma) * afasta) * escala }}
              className={cn(
                "tnum absolute grid h-[18px] min-w-[22px] -translate-x-1/2 -translate-y-1/2 cursor-pointer place-items-center rounded-full px-1 text-[10px] font-semibold leading-none",
                selecionada
                  ? "bg-(--color-ink) text-(--color-surface)"
                  : ocupada
                    ? "bg-(--color-surface) text-(--color-ink) shadow-[0_1px_3px_rgba(0,0,0,0.25)]"
                    : "border border-dashed border-(--color-line-2) bg-(--color-surface)/80 text-(--color-ink-3)",
              )}
            >
              P{c.numero}
            </button>
          );
        })}
    </div>
  );
}

export interface MesaNoPlanoProps extends Omit<TableShapeProps, "tabIndex"> {
  tabIndex: number;
  esmaecida: boolean;
  conflito: boolean;
  assentos: Assentos;
  posicoes?: CadeirasProps["posicoes"];
}

/**
 * Mesa e cadeiras num grupo de tamanho zero ancorado no centro da mesa: arrastar o grupo
 * move tudo junto por `transform`, sem recalcular layout, e o esmaecimento cobre as cadeiras.
 * Memoizado: com 120 mesas, só re-renderiza quem teve prop alterada (o hover vem do armazém).
 */
export const MesaNoPlano = React.memo(function MesaNoPlano({ esmaecida, conflito, assentos, posicoes, ...forma }: MesaNoPlanoProps) {
  const { mesa, escala = 1, selecionada, editando } = forma;
  // A mesa fixada mostra o detalhe completo (salvo "nenhum"), como na cena 3D.
  const nivel = assentos === "nenhum" ? null : selecionada ? "completo" : assentos;
  const comCadeiras = nivel !== null && Math.min(mesa.largura, mesa.altura) * escala >= TAMPO_MIN_CADEIRAS_PX;

  return (
    <div
      data-mesa-plano={mesa.id}
      data-conflito={conflito ? "" : undefined}
      className={cn("mesa-plano absolute h-0 w-0 transition-opacity duration-150", esmaecida && "opacity-25", selecionada ? "z-20" : "z-0")}
      style={{ left: `${mesa.x}%`, top: `${mesa.y}%` }}
    >
      {comCadeiras && <Cadeiras mesa={mesa} escala={escala} nivel={nivel} pesada={forma.estado === "ocupada"} posicoes={editando ? undefined : posicoes} />}
      <TableShape {...forma} />
    </div>
  );
});
